import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';

import { validateServerSession } from '@/src/utils/auth/session';
import { getApiHeaders } from '@/src/utils/server/get-headers';
import { logger } from '@/src/utils/server/logger';

import { DialAIError } from '@/src/types/error';
import { ShareRequestModel } from '@/src/types/share';

import { errorsMessages } from '@/src/constants/errors';

import { authOptions } from '@/src/pages/api/auth/[...nextauth]';

import fetch from 'node-fetch';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerSession(req, res, authOptions);
  const isSessionValid = validateServerSession(session, req, res);

  if (!isSessionValid) {
    return;
  }

  const token = await getToken({ req });

  try {
    const body = req.body as ShareRequestModel;

    const proxyRes = await fetch(
      `${process.env.DIAL_API_HOST}/v1/ops/publication/delete`,
      {
        method: 'POST',
        headers: getApiHeaders({ jwt: token?.access_token as string }),
        body: JSON.stringify(body),
      },
    );

    if (!proxyRes.ok) {
      let json: unknown;
      try {
        json = await proxyRes.json();
      } catch {
        json = undefined;
      }
      throw new DialAIError(
        (typeof json === 'string' && json) || proxyRes.statusText,
        '',
        '',
        proxyRes.status + '',
      );
    }

    return res.status(200).send({});
  } catch (error: unknown) {
    logger.error(error);
    if (error instanceof DialAIError) {
      return res
        .status(parseInt(error.code, 10) || 500)
        .send(error.message || errorsMessages.generalServer);
    }
    return res.status(500).send(errorsMessages.generalServer);
  }
};

export default handler;
