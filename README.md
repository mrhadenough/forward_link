# Realtime link forward


### Run

```
docker run -d --name forward_link -p 3000:3000 mrhadenough/forward_link:latest
```

### How to use

1. Open the page in two browsers and create a channel.
2. Open the same page in another browser, hit "join channel" and enter the secret number from the created channel.
3. Now everything you write in first browser goes to the second.
