declare module "*.png" {
  const value: {
    src: string;
  };
  export default value;
}

declare module "*.jpg";
declare module "*.jpeg";
declare module "*.svg";

declare module "*.gif" {
  const value: {
    src: string;
  };

  export default value;
}

interface Window {
  go?: {
    main?: unknown;
  };
}
