docker build --load -t onechat-local .
docker run -it --rm onechat-local sh
docker run -p 3000:3000 onechat-local
