using IMSharp.Domain.Entities;
using IMSharp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IMSharp.Infrastructure.Repositories;

public class UserRepository(ApplicationDbContext context) : Repository<User>(context), IUserRepository
{
    public async Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(u => u.Username == username, cancellationToken);
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
    }

    public async Task<User?> GetByOAuthAsync(string provider, string oauthId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(u => u.OAuthProvider == provider && u.OAuthId == oauthId, cancellationToken);
    }

    public async Task<IEnumerable<User>> SearchAsync(string keyword, CancellationToken cancellationToken = default)
    {
        var lowerKeyword = keyword.ToLower();
        return await _dbSet
            .Where(u => u.Username.ToLower().Contains(lowerKeyword) ||
                       (u.Email != null && u.Email.ToLower().Contains(lowerKeyword)) ||
                       u.DisplayName.ToLower().Contains(lowerKeyword))
            .Take(20)
            .ToListAsync(cancellationToken);
    }
}
