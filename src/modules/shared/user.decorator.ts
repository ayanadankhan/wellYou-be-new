import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const User = createParamDecorator(
  (key: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tokenUser = request.user;
    if (!tokenUser && !tokenUser.data) {
      return null;
    }

    const user = tokenUser.data;

    return key ? user?.[key] : user;
  }
);
