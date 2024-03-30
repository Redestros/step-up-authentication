using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddAuthentication()
    .AddJwtBearer(options =>
    {
        options.Authority = "http://localhost:8080/realms/step-up";
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            ValidAudiences = ["step-up-client", "account"],
            ValidIssuers = ["http://localhost:8080/realms/step-up"]
        };
        options.MapInboundClaims = false;
    });


builder.Services.AddAuthorizationBuilder()
    .AddPolicy("transfer", policyBuilder => 
        policyBuilder.RequireClaim("acr", "transfer"));

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policyBuilder => policyBuilder
        .WithOrigins("http://localhost:4200")
        .AllowAnyHeader()
        .AllowAnyMethod());
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();


app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapPost("/donate", () => new { Message = "You donated 100$ to Palestine, Thanks <3"})
    .WithName("Donate")
    .RequireAuthorization("transfer")
    .WithOpenApi();

app.Run();