// Square SDK 类型声明文件
declare module 'squareup' {
  export enum Environment {
    Production = 'production',
    Sandbox = 'sandbox'
  }

  export interface ClientOptions {
    accessToken: string;
    environment: Environment;
    applicationId?: string;
  }

  export interface PaymentLinkRequest {
    idempotencyKey: string;
    description?: string;
    quickPay?: {
      name: string;
      priceMoney: {
        amount: bigint;
        currency: string;
      };
      locationId: string;
    };
    checkoutOptions?: {
      redirectUrl?: string;
      askForShippingAddress?: boolean;
      merchantSupportEmail?: string;
    };
    prePopulatedData?: {
      buyerEmail?: string;
    };
  }

  export interface PaymentLinkResponse {
    result: {
      paymentLink?: {
        url?: string;
        id?: string;
      };
    };
  }

  export interface CheckoutApi {
    createPaymentLink(request: PaymentLinkRequest): Promise<PaymentLinkResponse>;
  }

  export class Client {
    constructor(options: ClientOptions);
    checkoutApi: CheckoutApi;
  }
}