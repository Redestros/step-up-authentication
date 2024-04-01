using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;

namespace TransferService.Auth;

public class AuthorizationResultTransformer : IAuthorizationMiddlewareResultHandler
{
    private readonly IAuthorizationMiddlewareResultHandler _handler;

    public AuthorizationResultTransformer()
    {
        _handler = new AuthorizationMiddlewareResultHandler();
    }


    public async Task HandleAsync(RequestDelegate next, HttpContext context, AuthorizationPolicy policy,
        PolicyAuthorizationResult authorizeResult)
    {
        if (authorizeResult is { Forbidden: true, AuthorizationFailure: not null })
        {
            if (authorizeResult.AuthorizationFailure.FailedRequirements.Any(requirement =>
                    requirement is TransferLevelRequirement))
            {
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;

                context.Response.Headers.WWWAuthenticate =
                    "Bearer error=\"insufficient_user_authentication\", error_description=\"A different authentication level is required\", acr_values=\"transfer\"";

                var responseBody = new StepUpChallenge("transfer", 0);
                await context.Response.WriteAsJsonAsync(responseBody);
            }
        }

        await _handler.HandleAsync(next, context, policy, authorizeResult);
    }

    private class StepUpChallenge
    {
        public string Acr { get; }
        public int MaxAge { get; }

        public StepUpChallenge(string acr, int maxAge)
        {
            Acr = acr;
            MaxAge = maxAge;
        }
    }
}