import crypto from 'crypto';


export const generateRawApiKey = (): string => {
  return `nf_live_${crypto.randomBytes(24).toString('hex')}`;
};


export const hashApiKey = (key: string): string => {
  return crypto.createHash('sha256').update(key).digest('hex');
};