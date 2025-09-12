// 应用配置类型定义

export interface ConfigProps {
  // 应用基本信息
  appName: string;
  appDescription: string;
  domainName: string;

  // Stripe支付配置
  stripe: {
    plans: StripePlan[];
  };

  // 文件存储配置 (Cloudflare R2)
  r2?: {
    bucket?: string;
    publicUrl?: string;
    endpoint?: string;
  };

  // 主题配置
  colors: {
    theme: Theme;
    main: string;
  };

  // 认证配置
  auth: {
    loginUrl: string;
    callbackUrl: string;
  };

  // Crisp聊天支持配置
  crisp?: {
    id?: string;
    onlyShowOnRoutes?: string[];
  };

  // 邮件支持配置
  mailgun?: {
    supportEmail?: string;
  };
}

// Stripe计划接口
export interface StripePlan {
  isFeatured?: boolean;
  isFree?: boolean;
  priceId?: string; // 免费计划可选
  name: string;
  description?: string;
  price: number;
  credits?: number; // 计划包含的信用点
  priceAnchor?: number | null;
  features: PlanFeature[];
}

export interface PlanFeature {
  name: string;
}

// 主题类型 (简化版，只保留常用的)
export type Theme =
  | "light"
  | "dark"
  | "cupcake"
  | "corporate"
  | "luxury"
  | "dracula"
  | "";