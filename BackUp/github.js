#!name=Github 429
#!desc=解除 Github 429 限制


[Header Rewrite]
http-request (raw|gist).githubusercontent.com header-replace Accept-Language en-us

[MITM]
hostname = %APPEND% raw.githubusercontent.com,gist.githubusercontent.com