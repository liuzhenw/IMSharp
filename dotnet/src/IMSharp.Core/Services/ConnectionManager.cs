using System.Collections.Concurrent;

namespace IMSharp.Core.Services;

public class ConnectionManager : IConnectionManager
{
    private readonly ConcurrentDictionary<Guid, HashSet<string>> _userConnections = new();

    public void AddConnection(Guid userId, string connectionId)
    {
        _userConnections.AddOrUpdate(
            userId,
            [connectionId],
            (key, connections) =>
            {
                lock (connections)
                {
                    connections.Add(connectionId);
                }
                return connections;
            });
    }

    public void RemoveConnection(Guid userId, string connectionId)
    {
        if (_userConnections.TryGetValue(userId, out var connections))
        {
            lock (connections)
            {
                connections.Remove(connectionId);
                if (connections.Count == 0)
                {
                    _userConnections.TryRemove(userId, out _);
                }
            }
        }
    }

    public IEnumerable<string> GetConnections(Guid userId)
    {
        if (_userConnections.TryGetValue(userId, out var connections))
        {
            lock (connections)
            {
                return connections.ToList();
            }
        }
        return Enumerable.Empty<string>();
    }

    public bool IsOnline(Guid userId)
    {
        return _userConnections.ContainsKey(userId);
    }
}
