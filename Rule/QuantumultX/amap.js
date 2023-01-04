[filter_local]
ip-cidr, 106.11.43.102/16, reject
ip-cidr, 203.209.245.78/16, reject
ip-cidr, 203.119.169.58/16, reject

[rewrite_local]
^https?:\/\/sns\.amap\.com\/ws\/msgbox\/pull.+ url reject-dict
^https?:\/\/sns\.amap\.com\/ws\/oss\/maplayer\/list\/? url reject-dict
^https?:\/\/m5.amap.com\/ws\/valueadded\/ url reject
^https?+:\/\/m\d\.amap\.com\/ws\/valueadded\/alimama\/splash_screen\/ url reject-200
^https?:\/\/m\d\.amap\.com\/ws\/valueadded\/splash_screen url reject-200
^http?:\/\/optimus-ads\.amap\.com\/uploadimg\/ url reject


[mitm] 
hostname=optimus-ads.amap.com, m5.amap.com, sns.amap.com, md.amap.com
