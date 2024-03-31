using Microsoft.AspNetCore.Authorization;

namespace TransferService.Auth;

public class TransferLevelHandler : AuthorizationHandler<TransferLevelRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context,
        TransferLevelRequirement requirement)
    {
        var acrClaim = context.User.Claims.FirstOrDefault(x => x.Type.Equals("acr"));
        
        if (acrClaim is null)
        {
            return Task.CompletedTask;
        }

        if (acrClaim.Value.Equals("transfer"))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}