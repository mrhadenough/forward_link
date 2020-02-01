# Realtime link forward

Simple link forwarder, useful for some smart tv browsers with not user-friendly keyboard to provide a better browsing experience.

### Run

```
docker run -d --name forward_link -p 3000:3000 mrhadenough/forward_link:latest
```
Nginx conf example [nginx.conf](./config/nginx.conf)

### How to use

1. Open the page in two browsers and create a channel.
2. Open the same page in another browser, hit "join channel" and enter the secret number from the created channel.
3. Now everything you write in first browser goes to the second.
