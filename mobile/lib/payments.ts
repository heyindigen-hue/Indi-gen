import { CFPaymentGatewayService, CFErrorResponse } from 'react-native-cashfree-pg-sdk';
import {
  CFSession,
  CFEnvironment,
  CFDropCheckoutPayment,
  CFThemeBuilder,
  CFPaymentComponentBuilder,
  CFPaymentModes,
} from 'cashfree-pg-api-contract';
import { api } from './api';

export function startTokenTopup(
  bundleId: string,
  onSuccess: (orderId: string) => void,
  onFailure: (error: string, orderId: string) => void
): Promise<void> {
  return api.post('/billing/checkout/topup', { bundle_id: bundleId }).then(({ data: order }) => {
    const session = new CFSession(
      order.order_token,
      order.order_id,
      CFEnvironment.SANDBOX
    );

    const theme = new CFThemeBuilder()
      .setBackgroundColor('#08090B')
      .setPrimaryTextColor('#F7F8F8')
      .setNavigationBarBackgroundColor('#111113')
      .setNavigationBarTextColor('#F7F8F8')
      .setButtonBackgroundColor('#7170FF')
      .setButtonTextColor('#FFFFFF')
      .build();

    const paymentComponents = new CFPaymentComponentBuilder()
      .add(CFPaymentModes.UPI)
      .add(CFPaymentModes.CARD)
      .add(CFPaymentModes.NB)
      .add(CFPaymentModes.WALLET)
      .build();

    const dropPayment = new CFDropCheckoutPayment(session, paymentComponents, theme);

    CFPaymentGatewayService.setCallback({
      onVerify(orderID: string) {
        onSuccess(orderID);
      },
      onError(error: CFErrorResponse, orderID: string) {
        onFailure(error.getMessage?.() ?? 'Payment failed', orderID);
      },
    });

    CFPaymentGatewayService.doPayment(dropPayment);
  });
}

export async function startSubscription(
  planId: string
): Promise<{ authorization_link: string; order_id: string }> {
  const { data } = await api.post('/billing/checkout/subscribe', { plan_id: planId });
  return data;
}
