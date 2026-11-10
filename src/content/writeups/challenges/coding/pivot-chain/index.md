---
title: "Pivot Chain"
platform: "HTB"
difficulty: "Easy"
summary: "Shortest weighted path between two hosts: Dijkstra with a heap."
tags: ["coding","python","dijkstra","graphs"]
order: 4
---

- Prob: {%preview https://app.hackthebox.com/challenges/Pivot%2520Chain?tab=play_challenge 
- Immediately think of Dijkstra's algorithm
- But i forgot how to write it lol
```python
import heapq

def main():
    first_line = input().split()
    n, m, start, end = int(first_line[0]), int(first_line[1]), first_line[2], first_line[3]

    graph = {}
    for _ in range(m):
        u, v, w = input().split()
        w = int(w)
        if u not in graph:
            graph[u] = []
        graph[u].append((v, w))

    # dijkstra
    dist = {start: 0}
    pq = [(0, start)]

    while pq:
        cost, node = heapq.heappop(pq)

        if node == end:
            print(cost)
            return

        if cost > dist.get(node, float('inf')):
            continue

        for neighbor, weight in graph.get(node, []):
            new_cost = cost + weight
            if new_cost < dist.get(neighbor, float('inf')):
                dist[neighbor] = new_cost
                heapq.heappush(pq, (new_cost, neighbor))

    print(dist.get(end, -1))  

main()
 
```
