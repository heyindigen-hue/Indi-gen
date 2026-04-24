import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { config } from '../config';

Cashfree.XClientId = config.cashfree.appId;
Cashfree.XClientSecret = config.cashfree.secret;
Cashfree.XEnvironment = config.cashfree.env === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;

export { Cashfree };
