using IMSharp.Domain.Entities;

namespace IMSharp.Infrastructure.Repositories;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<User?> GetByOAuthAsync(string provider, string oauthId, CancellationToken cancellationToken = default);
    Task<IEnumerable<User>> SearchAsync(string keyword, CancellationToken cancellationToken = default);
}
