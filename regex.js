const STORAGE_KEY = 'cip_regex_enabled_v1';
const DEFAULT_REGEX_ENABLED = true;
const originalContentMap = new WeakMap();

const defaultDocument = typeof document !== 'undefined' ? document : null;
const TEXT_NODE_FILTER =
    typeof NodeFilter !== 'undefined' ? NodeFilter.SHOW_TEXT : 4;

const EDEN_TEMPLATE_BASE64 =
    'PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9InpoLUNOIj4KICA8aGVhZD4KICAgIDxtZXRhIGNoYXJzZXQ9IlVURi04IiAvPgog' +
    'ICAgPG1ldGEgbmFtZT0idmlld3BvcnQiIGNvbnRlbnQ9IndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xIiAvPgog' +
    'ICAgPHRpdGxlPkJ1bm5ZJ3NMT1ZF5LqM5pS55oqE6KKt56aB5q2iPC90aXRsZT4KICAgIDxzdHlsZT4KICAgICAgQGltcG9ydCB1' +
    'cmwoJ2h0dHBzOi8vZm9udHNhcGkuemVvc2V2ZW4uY29tLzEyOC9tYWluL3Jlc3VsdC5jc3MnKTsKCiAgICAgIGJvZHkgewogICAg' +
    'ICAgIG1hcmdpbjogMDsKICAgICAgICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDsKICAgICAgICBjb2xvcjogI0Y5NkU5QTsKICAg' +
    'ICAgICBmb250LWZhbWlseTogJ0hhY2hpIE1hcnUgUG9wJzsKICAgICAgICBmb250LXdlaWdodDogbm9ybWFsOwogICAgICB9CiAg' +
    'ICAgIDpyb290IHsKICAgICAgICAtLWNhcmQtYm9yZGVyOiByZ2JhKDAsIDAsIDAsIDAuMTUpOwogICAgICAgIC0tYWNjZW50OiAj' +
    'ZjQ3MmI2OwogICAgICAgIC0tYWNjZW50LTI6ICNmYWNjMTU7CiAgICAgICAgLS1hY2NlbnQtMzogIzIyZDNlZTsKICAgICAgfQog' +
    'ICAgICAqIHsKICAgICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94OwogICAgICB9CgogICAgICAucXEtd3JhcCB7CiAgICAgICAg' +
    'bWF4LXdpZHRoOiA5MjBweDsKICAgICAgICBtYXJnaW46IDEycHggYXV0bzsKICAgICAgICBwYWRkaW5nOiAwOwogICAgICAgIGJh' +
    'Y2tncm91bmQ6IHRyYW5zcGFyZW50OwogICAgICAgIGJvcmRlcjogbm9uZTsKICAgICAgICBib3gtc2hhZG93OiBub25lOwogICAg' +
    'ICB9CiAgICAgIC5wYW5lbCB7CiAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlOwogICAgICAgIGJvcmRlci1yYWRpdXM6IDE0cHg7' +
    'CiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjsKICAgICAgfQogICAgICAucGFuZWw6OmJlZm9yZSB7CiAgICAgICAgY29udGVudDog' +
    'Jyc7CiAgICAgICAgcG9zaXRpb246IGFic29sdXRlOwogICAgICAgIGluc2V0OiAwOwogICAgICAgIGJhY2tncm91bmQ6IHVybCgn' +
    'aHR0cHM6Ly9pLnBvc3RpbWcuY2MvcUJHZDZRSnIvMjAyNTA5MjMwMDA2MTItMzYtMzA5LmpwZycpIGNlbnRlci9jb3ZlciBuby1y' +
    'ZXBlYXQ7CiAgICAgIH0KICAgICAgLnBhbmVsLWlubmVyIHsKICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7CiAgICAgICAgcGFk' +
    'ZGluZzogMTZweDsKICAgICAgfQoKICAgICAgLnFxLXJvdyB7CiAgICAgICAgZGlzcGxheTogZ3JpZDsKICAgICAgICBncmlkLXRl' +
    'bXBsYXRlLWNvbHVtbnM6IDI0MHB4IDFmcjsKICAgICAgICBnYXA6IDE2cHg7CiAgICAgICAgYWxpZ24taXRlbXM6IHN0cmV0Y2g7' +
    'CiAgICAgIH0KCiAgICAgIC5wb3NlLWNhcmQgewogICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTsKICAgICAgICBib3JkZXI6IDFw' +
    'eCBzb2xpZCB2YXIoLS1jYXJkLWJvcmRlcik7CiAgICAgICAgYm9yZGVyLXJhZGl1czogMTJweDsKICAgICAgICBvdmVyZmxvdzog' +
    'aGlkZGVuOwogICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC41KTsKICAgICAgICBtaW4taGVpZ2h0OiAy' +
    'NDBweDsKICAgICAgfQogICAgICAucG9zZS1jYXJkIGltZyB7CiAgICAgICAgd2lkdGg6IDEwMCU7CiAgICAgICAgaGVpZ2h0OiAx' +
    'MDAlOwogICAgICAgIG9iamVjdC1maXQ6IGNvdmVyOwogICAgICAgIGRpc3BsYXk6IGJsb2NrOwogICAgICB9CiAgICAgIC8qICQx' +
    'IOagh+etvueyieiJsuiNp+WFiSAqLwogICAgICAucG9zZS1uYW1lIHsKICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7CiAgICAg' +
    'ICAgbGVmdDogOHB4OwogICAgICAgIGJvdHRvbTogOHB4OwogICAgICAgIHBhZGRpbmc6IDRweCA4cHg7CiAgICAgICAgYm9yZGVy' +
    'LXJhZGl1czogOTk5cHg7CiAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjYpOwogICAgICAgIGZvbnQt' +
    'd2VpZ2h0OiA2MDA7CiAgICAgICAgY29sb3I6ICNGOTZFOUE7CiAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgyNDQsIDEx' +
    'NCwgMTgyLCAwLjU1KTsKICAgICAgICBib3gtc2hhZG93OiAwIDAgNnB4IHJnYmEoMjQ0LCAxMTQsIDE4MiwgMC43NSksIDAgMCAx' +
    'NHB4IHJnYmEoMjQ0LCAxMTQsIDE4MiwgMC40NSksCiAgICAgICAgICAwIDAgMjJweCByZ2JhKDI0NCwgMTE0LCAxODIsIDAuMzUp' +
    'OwogICAgICB9CgogICAgICAudG9wLXBhbmVsIHsKICAgICAgICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1jYXJkLWJvcmRlcik7' +
    'CiAgICAgICAgYm9yZGVyLXJhZGl1czogMTJweDsKICAgICAgICBwYWRkaW5nOiAxMnB4OwogICAgICAgIGJhY2tncm91bmQ6IHJn' +
    'YmEoMjU1LCAyNTUsIDI1NSwgMC42KTsKICAgICAgfQogICAgICAubWV0ZXIgewogICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTsK' +
    'ICAgICAgICBoZWlnaHQ6IDE4cHg7CiAgICAgICAgYm9yZGVyLXJhZGl1czogOTk5cHg7CiAgICAgICAgYmFja2dyb3VuZDogcmdi' +
    'YSgwLCAwLCAwLCAwLjA4KTsKICAgICAgICBvdmVyZmxvdzogaGlkZGVuOwogICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHJnYmEo' +
    'MCwgMCwgMCwgMC4xKTsKICAgICAgfQogICAgICAubWV0ZXItZmlsbCB7CiAgICAgICAgcG9zaXRpb246IGFic29sdXRlOwogICAg' +
    'ICAgIGxlZnQ6IDA7CiAgICAgICAgdG9wOiAwOwogICAgICAgIGhlaWdodDogMTAwJTsKICAgICAgICB3aWR0aDogMCU7CiAgICAg' +
    'ICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDkwZGVnLCB2YXIoLS1hY2NlbnQpLCB2YXIoLS1hY2NlbnQtMikpOwogICAg' +
    'ICB9CiAgICAgIC5tZXRlci10YXJnZXQgewogICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTsKICAgICAgICB0b3A6IC02cHg7CiAg' +
    'ICAgICAgd2lkdGg6IDJweDsKICAgICAgICBoZWlnaHQ6IDMwcHg7CiAgICAgICAgYmFja2dyb3VuZDogdmFyKC0tYWNjZW50LTMp' +
    'OwogICAgICB9CiAgICAgIC5tZXRlci1sYWJlbHMgewogICAgICAgIGRpc3BsYXk6IGZsZXg7CiAgICAgICAganVzdGlmeS1jb250' +
    'ZW50OiBzcGFjZS1iZXR3ZWVuOwogICAgICAgIGZvbnQtc2l6ZTogMTJweDsKICAgICAgICBjb2xvcjogI0Y5NkU5QTsKICAgICAg' +
    'ICBtYXJnaW4tdG9wOiA4cHg7CiAgICAgIH0KCiAgICAgIC5wdWxzZXMgewogICAgICAgIG1hcmdpbi10b3A6IDEycHg7CiAgICAg' +
    'ICAgZGlzcGxheTogZ3JpZDsKICAgICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IDFmciAxZnI7CiAgICAgICAgZ2FwOiAxMnB4' +
    'OwogICAgICB9CiAgICAgIC5wdWxzZS1jYXJkIHsKICAgICAgICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1jYXJkLWJvcmRlcik7' +
    'CiAgICAgICAgYm9yZGVyLXJhZGl1czogMTJweDsKICAgICAgICBwYWRkaW5nOiAxMnB4OwogICAgICAgIGJhY2tncm91bmQ6IHJn' +
    'YmEoMjU1LCAyNTUsIDI1NSwgMC42KTsKICAgICAgICBkaXNwbGF5OiBmbGV4OwogICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7' +
    'CiAgICAgICAgZ2FwOiAxMnB4OwogICAgICAgIGNvbG9yOiAjRjk2RTlBOwogICAgICB9CiAgICAgIC8qIOS7heabtOaNoui0tOWb' +
    'vu+8jOS/neeVmSBzY2FsZSDohInlhrLmlYjmnpwgKi8KICAgICAgLnB1bHNlLWRvdCB7CiAgICAgICAgd2lkdGg6IDQ2cHg7CiAg' +
    'ICAgICAgaGVpZ2h0OiA0NnB4OwogICAgICAgIGJvcmRlci1yYWRpdXM6IDUwJTsKICAgICAgICBmbGV4OiAwIDAgNDZweDsKICAg' +
    'ICAgICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiBjZW50ZXI7CiAgICAgICAgYmFja2dyb3VuZC1zaXplOiBjb3ZlcjsKICAgICAgICBi' +
    'YWNrZ3JvdW5kLXJlcGVhdDogbm8tcmVwZWF0OwogICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHJnYmEoMCwgMCwgMCwgMC4xKTsK' +
    'ICAgICAgICB3aWxsLWNoYW5nZTogdHJhbnNmb3JtOyAvKiDlubPmu5HnvKnmlL4gKi8KICAgICAgfQogICAgICAucHVsc2UtbGVm' +
    'dCB7CiAgICAgICAgYmFja2dyb3VuZC1pbWFnZTogdXJsKCdodHRwczovL2kucG9zdGltZy5jYy9qNU1rUk5qUC82M2Q5MTQzYjY0' +
    'YTM1Z3BpLmdpZicpOwogICAgICB9CiAgICAgIC5wdWxzZS1yaWdodCB7CiAgICAgICAgYmFja2dyb3VuZC1pbWFnZTogdXJsKCdo' +
    'dHRwczovL2kucG9zdGltZy5jYy9IazB6cDVabi82ODBmYjY1NTU0MjlkLUh1dy5naWYnKTsKICAgICAgfQoKICAgICAgLnB1bHNl' +
    'LW1ldGEgewogICAgICAgIGRpc3BsYXk6IGZsZXg7CiAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsKICAgICAgfQogICAg' +
    'ICAucHVsc2UtdGl0bGUgewogICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7CiAgICAgICAgY29sb3I6ICNGOTZFOUE7CiAgICAgIH0K' +
    'ICAgICAgLnB1bHNlLXN1YiB7CiAgICAgICAgZm9udC1zaXplOiAxMnB4OwogICAgICAgIGNvbG9yOiAjRjk2RTlBOwogICAgICB9' +
    'CgogICAgICAuaW5mb3MgewogICAgICAgIG1hcmdpbi10b3A6IDEycHg7CiAgICAgICAgZGlzcGxheTogZ3JpZDsKICAgICAgICBn' +
    'cmlkLXRlbXBsYXRlLWNvbHVtbnM6IDFmciAxZnI7CiAgICAgICAgZ2FwOiAxMnB4OwogICAgICB9CiAgICAgIC5pbmZvLWNhcmQg' +
    'ewogICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTsKICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDI1NSwgMjU1LCAyNTUs' +
    'IDAuNik7CiAgICAgICAgYm9yZGVyLXJhZGl1czogNnB4OwogICAgICAgIHBhZGRpbmc6IDEwcHg7CiAgICAgICAgY29sb3I6ICNG' +
    'OTZFOUE7CiAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgwLCAwLCAwLCAwLjEpOwogICAgICB9CiAgICAgIC5pbmZvLWNh' +
    'cmQgLnRpdGxlIHsKICAgICAgICBmb250LXNpemU6IDAuODVlbTsKICAgICAgICBmb250LXdlaWdodDogNzAwOwogICAgICAgIGNv' +
    'bG9yOiAjRjk2RTlBOwogICAgICB9CiAgICAgIC5pbmZvLWNhcmQgLnRleHQgewogICAgICAgIGZvbnQtc2l6ZTogMC45ZW07CiAg' +
    'ICAgICAgY29sb3I6ICNGOTZFOUE7CiAgICAgICAgZGlzcGxheTogYmxvY2s7CiAgICAgICAgbWFyZ2luLXRvcDogMXB4OwogICAg' +
    'ICAgIHBhZGRpbmc6IDAgNXB4OwogICAgICAgIHdoaXRlLXNwYWNlOiBwcmUtd3JhcDsKICAgICAgfQoKICAgICAgLyogPT09PT09' +
    'IOenu+WKqOerr+mAgumFje+8muKJpDY0MHB4IOWNleWIl+e6teWQkeS6lOWdlyA9PT09PT0gKi8KICAgICAgQG1lZGlhIChtYXgt' +
    'd2lkdGg6IDY0MHB4KSB7CiAgICAgICAgLnFxLXdyYXAgewogICAgICAgICAgbWF4LXdpZHRoOiAxMDAlOwogICAgICAgICAgbWFy' +
    'Z2luOiA4cHggYXV0bzsKICAgICAgICB9CiAgICAgICAgLnBhbmVsLWlubmVyIHsKICAgICAgICAgIHBhZGRpbmc6IDEycHg7CiAg' +
    'ICAgICAgfQogICAgICAgIC5xcS1yb3cgewogICAgICAgICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAxZnI7CiAgICAgICAgICBn' +
    'YXA6IDEycHg7CiAgICAgICAgfSAvKiDkuLvmoIXmoLzmlLnkuLrljZXliJfvvJrkvZPkvY3ljaEg4oaSIOWPs+S+p+WGheWuuSAq' +
    'LwogICAgICAgIC5wb3NlLWNhcmQgewogICAgICAgICAgbWluLWhlaWdodDogMjAwcHg7CiAgICAgICAgfQoKICAgICAgICAvKiDl' +
    'j7PkvqflhoXlrrnlhoXpg6jkv53mjIHpobrluo/vvJrov5vluqbmnaEg4oaSIOWQruWQuOWNoSDihpIg5o+J5o2P5Y2hIOKGkiDk' +
    'v6Hmga/ljLogKi8KICAgICAgICAucHVsc2VzIHsKICAgICAgICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMWZyOwogICAgICAg' +
    'ICAgZ2FwOiAxMnB4OwogICAgICAgIH0gLyog6ISJ5Yay5Lik5Y2h5ZCE5Y2g5LiA6KGMICovCiAgICAgICAgLmluZm9zIHsKICAg' +
    'ICAgICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMWZyOwogICAgICAgICAgZ2FwOiAxMnB4OwogICAgICAgIH0gLyog5L+h5oGv' +
    '5Yy65Lik5Y2h5ZCE5Y2g5LiA6KGM77yI5L+h5oGv5Yy65pW05L2T5LuN6KeG5L2c56ysNeWdl++8iSAqLwoKICAgICAgICAubWV0' +
    'ZXItbGFiZWxzIHsKICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDsKICAgICAgICB9CiAgICAgICAgLnBvc2UtbmFtZSB7CiAgICAg' +
    'ICAgICBmb250LXNpemU6IDE0cHg7CiAgICAgICAgfQogICAgICB9CiAgICA8L3N0eWxlPgogIDwvaGVhZD4KICA8Ym9keT4KICAg' +
    'IDxkaXYgY2xhc3M9InFxLXdyYXAiPgogICAgICA8ZGV0YWlscyBjbG9zZT4KICAgICAgICA8c3VtbWFyeT7niLHnmoTmirHmirE8' +
    'L3N1bW1hcnk+CiAgICAgICAgPGRpdiBjbGFzcz0icGFuZWwiPgogICAgICAgICAgPGRpdiBjbGFzcz0icGFuZWwtaW5uZXIiIGlk' +
    'PSJxcSI+CiAgICAgICAgICAgIDxkaXYgY2xhc3M9InFxLXJvdyI+CiAgICAgICAgICAgICAgPGRpdiBjbGFzcz0icG9zZS1jYXJk' +
    'Ij4KICAgICAgICAgICAgICAgIDxpbWcgaWQ9InBvc2VJbWciIGFsdD0icG9zZSIgc3JjPSIiIC8+CiAgICAgICAgICAgICAgICA8' +
    'ZGl2IGNsYXNzPSJwb3NlLW5hbWUiIGlkPSJwb3NlTmFtZSI+JDE8L2Rpdj4KICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAg' +
    'ICAgICA8ZGl2PgogICAgICAgICAgICAgICAgPGRpdiBjbGFzcz0idG9wLXBhbmVsIj4KICAgICAgICAgICAgICAgICAgPGRpdiBj' +
    'bGFzcz0ibWV0ZXIiIGlkPSJtZXRlciI+CiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz0ibWV0ZXItZmlsbCIgaWQ9Im1l' +
    'dGVyRmlsbCI+PC9kaXY+CiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz0ibWV0ZXItdGFyZ2V0IiBpZD0ibWV0ZXJUYXJn' +
    'ZXQiIHN0eWxlPSJsZWZ0OiAwJSI+PC9kaXY+CiAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgICA8ZGl2' +
    'IGNsYXNzPSJtZXRlci1sYWJlbHMiPgogICAgICAgICAgICAgICAgICAgIDxzcGFuPuWNs+WwhuaPkuWFpfCfkpM8L3NwYW4+PHNw' +
    'YW4+5rWF5rWF56CU56Oo8J+SlTwvc3Bhbj48c3Bhbj7muJDlhaXkvbPlooPwn5KePC9zcGFuPjxzcGFuPuWGsuWIuuWKoOmAn/Cf' +
    'kpc8L3NwYW4KICAgICAgICAgICAgICAgICAgICA+PHNwYW4+5qGD5Zut5rex5aSE8J+Spjwvc3Bhbj4KICAgICAgICAgICAgICAg' +
    'ICAgPC9kaXY+CiAgICAgICAgICAgICAgICA8L2Rpdj4KCiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJwdWxzZXMiPgogICAg' +
    'ICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJwdWxzZS1jYXJkIj4KICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJwdWxz' +
    'ZS1kb3QgcHVsc2UtbGVmdCIgaWQ9InB1bHNlNSI+PC9kaXY+CiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz0icHVsc2Ut' +
    'bWV0YSI+CiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJwdWxzZS10aXRsZSI+5ZCu5ZC45Yqb5bqm8J+RhTwvZGl2' +
    'PgogICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz0icHVsc2Utc3ViIj4kNS8xMDA8L2Rpdj4KICAgICAgICAgICAgICAg' +
    'ICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9InB1bHNlLWNh' +
    'cmQiPgogICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9InB1bHNlLWRvdCBwdWxzZS1yaWdodCIgaWQ9InB1bHNlNiI+PC9k' +
    'aXY+CiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz0icHVsc2UtbWV0YSI+CiAgICAgICAgICAgICAgICAgICAgICA8ZGl2' +
    'IGNsYXNzPSJwdWxzZS10aXRsZSI+5o+J5o2P5Yqb5bqm8J+RkDwvZGl2PgogICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFz' +
    'cz0icHVsc2Utc3ViIj4kNi8xMDA8L2Rpdj4KICAgICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgICAgPC9k' +
    'aXY+CiAgICAgICAgICAgICAgICA8L2Rpdj4KCiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJpbmZvcyI+CiAgICAgICAgICAg' +
    'ICAgICAgIDxkaXYgY2xhc3M9ImluZm8tY2FyZCI+CiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9InRpdGxlIj7wn42G' +
    '5ZSn5ZSn54q25oCBOjwvc3Bhbj48YnIgLz4KICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dCIgaWQ9ImRldGFp' +
    'bDIiPiQyPC9zcGFuPgogICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz0iaW5mby1j' +
    'YXJkIj4KICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0idGl0bGUiPvCfk43mipPmj6HkvY3nva46PC9zcGFuPjxiciAv' +
    'PgogICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0IiBpZD0iZGV0YWlsNyI+JDc8L3NwYW4+CiAgICAgICAgICAg' +
    'ICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgIDwvZGl2' +
    'PgogICAgICAgICAgPC9kaXY+CiAgICAgICAgPC9kaXY+CiAgICAgIDwvZGV0YWlscz4KICAgIDwvZGl2PgoKICAgIDxzY3JpcHQ+' +
    'CiAgICAgIC8vIOm7mOiupOWNoOS9jeWbvu+8iOW9kyAkMSDmnKrljLnphY3liLDmmKDlsITml7bkvb/nlKjvvIkKICAgICAgY29u' +
    'c3QgREVGQVVMVF9QT1NFX0lNRyA9ICdodHRwczovL2kucG9zdGltZy5jYy9kUTd6Skg4MC82ODBmYjY1NjYyNmRlLVJ5LUQuZ2lm' +
    'JzsKCiAgICAgIC8vIOS9k+S9jSAtPiDlm77niYfmmKDlsITvvIjlj6/oh6rooYzmianlsZXvvIkKICAgICAgY29uc3QgUE9TRV9J' +
    'TUFHRVMgPSB7CiAgICAgICAgZGVmYXVsdDogREVGQVVMVF9QT1NFX0lNRywKICAgICAgICBNaXNzaW9uYXJ5OiAnaHR0cHM6Ly9p' +
    'LnBvc3RpbWcuY2MvV2Jwbjh0WEovcGVyaW9kLXNleC1wb3N0aW9ucy1taXNzaW9uYXJ5LmdpZicsCiAgICAgICAgJ0RvZ2d5IFN0' +
    'eWxlJzogJ2h0dHBzOi8vaS5wb3N0aW1nLmNjL0hrcVhxTDR6L3BlcmlvZC1zZXgtcG9zdGlvbnMtc3RhbmQtdXAtZG9vZ2llLmdp' +
    'ZicsCiAgICAgICAgJ1N0YW5kaW5nIERvZ2d5JzoKICAgICAgICAgICdodHRwczovL2ltYWdlcy51bnNwbGFzaC5jb20vcGhvdG8t' +
    'MTUxMjQyODU1OTA4Ny01NjBmYTVjZWFiNDI/cT04MCZ3PTgwMCZhdXRvPWZvcm1hdCZmaXQ9Y3JvcCcsCiAgICAgICAgJ1JldmVy' +
    'c2UgQ293Z2lybCc6ICdodHRwczovL2kucG9zdGltZy5jYy8yOHpEeGRzRi9yZXZlcnNlLWNvd2dpcmwuanBnJywKICAgICAgICBT' +
    'cG9vbmluZzogJ2h0dHBzOi8vaS5wb3N0aW1nLmNjL3BkMFpndnJML3Nwb29uaW5nLWJlc3Qtc2V4LXBvc2l0aW9uLW1lbi1saWtl' +
    'LW1vc3QuanBnJywKICAgICAgICBTdGFuZGluZzogJ2h0dHBzOi8vaS5wb3N0aW1nLmNjL2oybkozMHdtL3N0YW5kaW5nLWJlc3Qt' +
    'c2V4LXBvc2l0aW9uLW1lbi1saWtlLW1vc3QuanBnJywKICAgICAgICBMb3R1czogJ2h0dHBzOi8vaS5wb3N0aW1nLmNjL1ZMR2ty' +
    'SEpiL3dvbWFuLW9uLXRvcC1iZXN0LXNleC1wb3NpdGlvbi1tZW4tbGlrZS1tb3N0LmpwZycsCiAgICAgICAgTmVsc29uOiAnaHR0' +
    'cHM6Ly9pLnBvc3RpbWcuY2MvbTJ4MGRZSzYvMjUwNTA4NjEud2VicCcsCiAgICAgICAgJ1Byb25lIEJvbmUnOgogICAgICAgICAg' +
    'J2h0dHBzOi8vaS5wb3N0aW1nLmNjLzR5OEgzNENZL09JUC1iMnAtWE5xZC1LeC1HcHktSTk5bWQtQ05PMy1BQUFBQS13LTIyOC1o' +
    'LTE1NC1jLTctci0wLW8tNS1kcHItMS0zLXBpZC0xLmpwZycsCiAgICAgICAgV2hlZWxiYXJyb3c6ICdodHRwczovL2kucG9zdGlt' +
    'Zy5jYy8yeXZqc3prcC93aGVlbGJhcnJvdy5qcGcnLAogICAgICAgICdmYWNlIGRvd24nOiAnaHR0cHM6Ly9pLnBvc3RpbWcuY2Mv' +
    'OENXeWY5enAvdGhlLWV2ZXlyZ2lybC1zZXgtcG9zaXRpb24tbGF6eS1jaHVybmVyLTEwMjR4ODUzLmpwZycsCiAgICAgICAgJ1Ro' +
    'ZSBQb2dvIFN0aWNrJzogJ2h0dHBzOi8vaS5wb3N0aW1nLmNjL21ESzJwY0dOL1BvZ28tc3RpY2suanBnJywKICAgICAgICBGbGF0' +
    'aXJvbjogJ2h0dHBzOi8vaS5wb3N0aW1nLmNjL1B4UDRIN3Z6L2ZsYXRpcm9uLWJlc3Qtc2V4LXBvc2l0aW9uLW1lbi1saWtlLW1v' +
    'c3QuanBnJywKICAgICAgICAnaG9sZCBicmVhc3QgZnVjayc6ICdodHRwczovL2kucG9zdGltZy5jYy9IeGg2N20xaC9naXBoeS5n' +
    'aWYnLAogICAgICAgICdUaGUgQnV0dGVyIENodXJuZXInOiAnaHR0cHM6Ly9pLnBvc3RpbWcuY2MvRzJDWEZLNGsvU2F0aW4tTWlu' +
    'aW9ucy0yNjYwNzktRmFjZS1Eb3duLUFuaW1hdGlvbi0zLmdpZicsCiAgICAgICAgJ1RoZSBvdmVycGFzcyc6ICdodHRwczovL2ku' +
    'cG9zdGltZy5jYy9kMWhWOTJnVi9UaGUtb3ZlcnBhc3MuanBnJywKICAgICAgfTsKCiAgICAgIC8vIOa3seW6puaYoOWwhO+8iOS9' +
    'jee9ruaPj+i/sCAkNO+8iQogICAgICBjb25zdCBERVBUSF9NQVAgPSB7IOWNs+WwhuaPkuWFpTogMCwg5rWF5rWF56CU56OoOiAy' +
    'MCwg5riQ5YWl5L2z5aKDOiA3MCwg5Yay5Yi65Yqg6YCfOiA5MCwg5qGD5Zut5rex5aSEOiAxMDAgfTsKCiAgICAgIC8vIOWIneWn' +
    'i+Wdh+aYvuekuuWNoOS9jeespiAkMX4kNwogICAgICBjb25zdCBzdGF0ZSA9IHsgcG9zZTogJyQxJywgcGVuaXM6ICckMicsIHNw' +
    'ZWVkOiAnJDMnLCBkZXB0aFRleHQ6ICckNCcsIHN1Y2s6ICckNScsIGtuZWFkOiAnJDYnLCBoYW5kczogJyQ3JyB9OwoKICAgICAg' +
    'Ly8gRE9NCiAgICAgIGNvbnN0IGVsID0gewogICAgICAgIHBvc2VJbWc6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwb3NlSW1n' +
    'JyksCiAgICAgICAgcG9zZU5hbWU6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwb3NlTmFtZScpLAogICAgICAgIG1ldGVyRmls' +
    'bDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21ldGVyRmlsbCcpLAogICAgICAgIG1ldGVyVGFyZ2V0OiBkb2N1bWVudC5nZXRF' +
    'bGVtZW50QnlJZCgnbWV0ZXJUYXJnZXQnKSwKICAgICAgICBwdWxzZTU6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwdWxzZTUn' +
    'KSwKICAgICAgICBwdWxzZTY6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwdWxzZTYnKSwKICAgICAgICBkZXRhaWwyOiBkb2N1' +
    'bWVudC5nZXRFbGVtZW50QnlJZCgnZGV0YWlsMicpLAogICAgICAgIGRldGFpbDc6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdk' +
    'ZXRhaWw3JyksCiAgICAgIH07CgogICAgICBmdW5jdGlvbiByZXNvbHZlUG9zZUltZyhuYW1lKSB7CiAgICAgICAgaWYgKCFuYW1l' +
    'IHx8IG5hbWUuc3RhcnRzV2l0aCgnJCcpKSByZXR1cm4gREVGQVVMVF9QT1NFX0lNRzsKICAgICAgICBjb25zdCBrZXkgPSBPYmpl' +
    'Y3Qua2V5cyhQT1NFX0lNQUdFUykuZmluZChrID0+IGsudG9Mb3dlckNhc2UoKSA9PT0gU3RyaW5nKG5hbWUpLnRvTG93ZXJDYXNl' +
    'KCkpOwogICAgICAgIHJldHVybiBrZXkgJiYgUE9TRV9JTUFHRVNba2V5XSA/IFBPU0VfSU1BR0VTW2tleV0gOiBERUZBVUxUX1BP' +
    'U0VfSU1HOwogICAgICB9CgogICAgICBmdW5jdGlvbiBudW0odikgewogICAgICAgIGNvbnN0IG4gPSBOdW1iZXIodik7CiAgICAg' +
    'ICAgcmV0dXJuIE51bWJlci5pc0Zpbml0ZShuKSA/IG4gOiAwOwogICAgICB9CiAgICAgIGZ1bmN0aW9uIHRndFBjdCgpIHsKICAg' +
    'ICAgICBjb25zdCB4ID0gREVQVEhfTUFQW3N0YXRlLmRlcHRoVGV4dF07CiAgICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSAnbnVt' +
    'YmVyJyA/IHggOiAwOwogICAgICB9CgogICAgICAvLyDmuLLmn5PpnZnmgIHmlofmoYjvvIjkv53nlZkgJCDljaDkvY3mmL7npLrv' +
    'vIkKICAgICAgZnVuY3Rpb24gc3luY1VJKCkgewogICAgICAgIGVsLnBvc2VJbWcuc3JjID0gcmVzb2x2ZVBvc2VJbWcoc3RhdGUu' +
    'cG9zZSk7CiAgICAgICAgZWwucG9zZU5hbWUudGV4dENvbnRlbnQgPSBzdGF0ZS5wb3NlOwogICAgICAgIGVsLmRldGFpbDIudGV4' +
    'dENvbnRlbnQgPSBzdGF0ZS5wZW5pczsKICAgICAgICBlbC5kZXRhaWw3LnRleHRDb250ZW50ID0gc3RhdGUuaGFuZHM7CiAgICAg' +
    'IH0KCiAgICAgIC8vIOWKqOeUu++8mui/m+W6puadoeW+gOi/lCArIOiEieWGsuWRvOWQuO+8iOS/neeVmeiEieWGsuaViOaenO+8' +
    'iQogICAgICBsZXQgcmFmSWQgPSBudWxsLAogICAgICAgIHQgPSAwOwogICAgICBmdW5jdGlvbiBhbmltYXRlKG5vdykgewogICAg' +
    'ICAgIGlmICghYW5pbWF0ZS5sYXN0KSBhbmltYXRlLmxhc3QgPSBub3c7CiAgICAgICAgY29uc3QgZHQgPSAobm93IC0gYW5pbWF0' +
    'ZS5sYXN0KSAvIDEwMDA7CiAgICAgICAgYW5pbWF0ZS5sYXN0ID0gbm93OwoKICAgICAgICBjb25zdCBzcGVlZCA9IG51bShzdGF0' +
    'ZS5zcGVlZCk7CiAgICAgICAgY29uc3QgdiA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEwMCwgc3BlZWQpKSAqIDAuMTsgLy8gJS9z' +
    'CiAgICAgICAgY29uc3QgdGFyZ2V0ID0gdGd0UGN0KCk7CgogICAgICAgIHQgKz0gZHQgKiB2OwogICAgICAgIGNvbnN0IHRyaSA9' +
    'IDEgLSBNYXRoLmFicygodCAlIDIpIC0gMSk7IC8vIDAuLjEuLjAKICAgICAgICBjb25zdCBjdXIgPSB0cmkgKiBNYXRoLm1heCgw' +
    'LCB0YXJnZXQpOwogICAgICAgIGVsLm1ldGVyRmlsbC5zdHlsZS53aWR0aCA9IGN1ciArICclJzsKICAgICAgICBlbC5tZXRlclRh' +
    'cmdldC5zdHlsZS5sZWZ0ID0gdGFyZ2V0ICsgJyUnOwoKICAgICAgICBjb25zdCB3ID0gMC41ICsgMC41ICogTWF0aC5zaW4odCAq' +
    'IDIgKiBNYXRoLlBJKTsKICAgICAgICBjb25zdCBiYXNlU2NhbGUgPSAwLjkgKyAwLjIgKiB3OwogICAgICAgIGNvbnN0IHM1ID0g' +
    'MC44NSArIDAuMDAzICogTWF0aC5tYXgoMCwgTWF0aC5taW4oMTAwLCBudW0oc3RhdGUuc3VjaykpKTsKICAgICAgICBjb25zdCBz' +
    'NiA9IDAuODUgKyAwLjAwMyAqIE1hdGgubWF4KDAsIE1hdGgubWluKDEwMCwgbnVtKHN0YXRlLmtuZWFkKSkpOwogICAgICAgIGVs' +
    'LnB1bHNlNS5zdHlsZS50cmFuc2Zvcm0gPSBgc2NhbGUoJHtiYXNlU2NhbGUgKiBzNX0pYDsKICAgICAgICBlbC5wdWxzZTYuc3R5' +
    'bGUudHJhbnNmb3JtID0gYHNjYWxlKCR7YmFzZVNjYWxlICogczZ9KWA7CgogICAgICAgIHJhZklkID0gcmVxdWVzdEFuaW1hdGlv' +
    'bkZyYW1lKGFuaW1hdGUpOwogICAgICB9CgogICAgICAvLyDlpJbpg6ggQVBJ77yI5L6bIFNUIOiwg+eUqO+8iQogICAgICB3aW5k' +
    'b3cudXBkYXRlUVFTdGF0dXMgPSBmdW5jdGlvbiAoeyBwb3NlLCBwZW5pcywgc3BlZWQsIGRlcHRoVGV4dCwgc3Vjaywga25lYWQs' +
    'IGhhbmRzIH0pIHsKICAgICAgICBpZiAocG9zZSAhPT0gdW5kZWZpbmVkKSBzdGF0ZS5wb3NlID0gcG9zZTsKICAgICAgICBpZiAo' +
    'cGVuaXMgIT09IHVuZGVmaW5lZCkgc3RhdGUucGVuaXMgPSBwZW5pczsKICAgICAgICBpZiAoc3BlZWQgIT09IHVuZGVmaW5lZCkg' +
    'c3RhdGUuc3BlZWQgPSBzcGVlZDsKICAgICAgICBpZiAoZGVwdGhUZXh0ICE9PSB1bmRlZmluZWQpIHN0YXRlLmRlcHRoVGV4dCA9' +
    'IGRlcHRoVGV4dDsKICAgICAgICBpZiAoc3VjayAhPT0gdW5kZWZpbmVkKSBzdGF0ZS5zdWNrID0gc3VjazsKICAgICAgICBpZiAo' +
    'a25lYWQgIT09IHVuZGVmaW5lZCkgc3RhdGUua25lYWQgPSBrbmVhZDsKICAgICAgICBpZiAoaGFuZHMgIT09IHVuZGVmaW5lZCkg' +
    'c3RhdGUuaGFuZHMgPSBoYW5kczsKICAgICAgICBzeW5jVUkoKTsKICAgICAgfTsKCiAgICAgIHN5bmNVSSgpOwogICAgICByYWZJ' +
    'ZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKTsKICAgIDwvc2NyaXB0PgogIDwvYm9keT4KPC9odG1sPg==';

const textDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;

const decodeBase64ToString = (base64) => {
    if (typeof atob === 'function') {
        const binary = atob(base64);
        if (textDecoder) {
            const bytes = new Uint8Array(binary.length);
            for (let index = 0; index < binary.length; index += 1) {
                bytes[index] = binary.charCodeAt(index);
            }
            return textDecoder.decode(bytes);
        }

        try {
            return decodeURIComponent(
                binary
                    .split('')
                    .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
                    .join('')
            );
        } catch (error) {
            return binary;
        }
    }

    if (typeof Buffer !== 'undefined') {
        return Buffer.from(base64, 'base64').toString('utf-8');
    }

    return '';
};

const EDEN_TEMPLATE_HTML = decodeBase64ToString(EDEN_TEMPLATE_BASE64);

const applyEdenTemplatePlaceholders = (template, values) =>
    template.replace(/\$(\d+)/g, (_, groupIndex) => values[Number(groupIndex) - 1] ?? '');

const REGEX_RULES = [
    {
        id: 'bhl-timestamp',
        pattern: /^『(.*?) \|(.*?)』$/gm,
        createNode({ documentRef, groups }) {
            const [time = '', text = ''] = groups;
            const doc = documentRef || defaultDocument;
            if (!doc) return null;
            const container = doc.createElement('div');
            container.style.textAlign = 'center';
            container.style.color = '#8e8e93';
            container.style.fontFamily = "'linja waso', sans-serif";
            container.style.fontSize = '13px';
            container.style.margin = '12px 0';
            const safeTime = time.trim();
            const safeText = text.trim();
            container.textContent = `${safeTime}\u00A0\u00A0\u00A0${safeText}`;
            return container;
        },
    },
    {
        id: 'bhl-bubble-self',
        pattern: /\[(.*?)\\(.*?)\\(.*?)\]/gm,
        createNode({ documentRef, groups }) {
            const [name = '', time = '', message = ''] = groups;
            const doc = documentRef || defaultDocument;
            if (!doc) return null;

            const container = doc.createElement('div');
            container.style.margin = '10px 0';
            container.style.maxWidth = '75%';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'flex-end';
            container.style.marginLeft = 'auto';

            const header = doc.createElement('div');
            header.style.fontSize = '12px';
            header.style.color = '#8a8a8a';
            header.style.marginRight = '5px';
            header.style.marginBottom = '5px';

            const nameSpan = doc.createElement('span');
            nameSpan.textContent = name.trim();

            header.appendChild(nameSpan);

            const bodyWrapper = doc.createElement('div');
            bodyWrapper.style.display = 'flex';
            bodyWrapper.style.alignItems = 'flex-end';
            bodyWrapper.style.width = '100%';
            bodyWrapper.style.justifyContent = 'flex-end';

            const timeSpan = doc.createElement('span');
            timeSpan.style.fontSize = '12px';
            timeSpan.style.color = '#b2b2b2';
            timeSpan.style.marginRight = '8px';
            timeSpan.style.flexShrink = '0';
            timeSpan.textContent = time.trim();

            const bubble = doc.createElement('div');
            bubble.style.backgroundColor = '#8DE041';
            bubble.style.color = '#000000';
            bubble.style.padding = '12px 16px';
            bubble.style.borderRadius = '20px';
            bubble.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.08)';
            bubble.style.position = 'relative';
            bubble.style.maxWidth = '100%';

            const paragraph = doc.createElement('p');
            paragraph.style.margin = '0';
            paragraph.style.whiteSpace = 'pre-wrap';
            paragraph.style.wordWrap = 'break-word';
            paragraph.style.fontSize = '12px';
            paragraph.style.lineHeight = '1.5';
            paragraph.textContent = message.trim();

            bubble.appendChild(paragraph);

            bodyWrapper.appendChild(timeSpan);
            bodyWrapper.appendChild(bubble);

            container.appendChild(header);
            container.appendChild(bodyWrapper);

            return container;
        },
    },
    {
        id: 'bhl-bubble',
        pattern: /\[(.*?)\/(.*?)\/(.*?)\]/gm,
        createNode({ documentRef, groups }) {
            const [name = '', message = '', time = ''] = groups;
            const doc = documentRef || defaultDocument;
            if (!doc) return null;

            const container = doc.createElement('div');
            container.style.margin = '10px 0';
            container.style.maxWidth = '75%';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'flex-start';

            const header = doc.createElement('div');
            header.style.fontSize = '13px';
            header.style.color = '#8a8a8a';
            header.style.marginLeft = '5px';
            header.style.marginBottom = '5px';
            header.style.display = 'flex';
            header.style.alignItems = 'center';

            const nameSpan = doc.createElement('span');
            nameSpan.style.fontWeight = '300';
            nameSpan.textContent = name.trim();

            header.appendChild(nameSpan);

            const bodyWrapper = doc.createElement('div');
            bodyWrapper.style.display = 'flex';
            bodyWrapper.style.alignItems = 'flex-end';
            bodyWrapper.style.width = '100%';

            const bubble = doc.createElement('div');
            bubble.style.backgroundColor = '#ffffff';
            bubble.style.color = '#000000';
            bubble.style.padding = '12px 16px';
            bubble.style.borderRadius = '20px';
            bubble.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.08)';
            bubble.style.position = 'relative';
            bubble.style.maxWidth = '100%';

            const paragraph = doc.createElement('p');
            paragraph.style.margin = '0';
            paragraph.style.whiteSpace = 'pre-wrap';
            paragraph.style.wordWrap = 'break-word';
            paragraph.style.fontSize = '12px';
            paragraph.style.lineHeight = '1.5';
            paragraph.textContent = message.trim();

            bubble.appendChild(paragraph);

            const timeSpan = doc.createElement('span');
            timeSpan.style.fontSize = '12px';
            timeSpan.style.color = '#b2b2b2';
            timeSpan.style.marginLeft = '8px';
            timeSpan.style.flexShrink = '0';
            timeSpan.textContent = time.trim();

            bodyWrapper.appendChild(bubble);
            bodyWrapper.appendChild(timeSpan);

            container.appendChild(header);
            container.appendChild(bodyWrapper);

            return container;
        },
    },
    {
        id: 'eden-entry',
        pattern:
            /<伊甸园>\s*<time>(.*?)<\/time>\s*<location>(.*?)<\/location>\s*<character>\s*<AAA>\s*阶段：(.*?)\s*第(.*?)天\s*<\/AAA>\s*<namestr>(.*?)<\/namestr>\s*<appearance>\s*种族\|(.*?)\s*年龄\|(.*?)\s*<\/appearance>\s*<SSS>\s*小穴\|(.*?)\s*子宫\|(.*?)\s*菊穴\|(.*?)\s*直肠\|(.*?)\s*乳房\|(.*?)\s*特质\|(.*?)\s*<\/SSS>\s*<reproduction>\s*精子\|(.*?)\s*卵子\|(.*?)\s*胎数\|(.*?)\s*父亲\|(.*?)\s*健康\|(.*?)\s*供养\|(.*?)\s*反应\|(.*?)\s*<\/reproduction>\s*<\/character>\s*<\/伊甸园>/gs,
        createNode({ documentRef, groups }) {
            const doc = documentRef || defaultDocument;
            if (!doc) return null;

            const escapeHTML = (value) =>
                (value ?? '').replace(/[&<>'"]/g, (char) => {
                    switch (char) {
                        case '&':
                            return '&amp;';
                        case '<':
                            return '&lt;';
                        case '>':
                            return '&gt;';
                        case "'":
                            return '&#39;';
                        case '"':
                            return '&quot;';
                        default:
                            return char;
                    }
                });

            const normalized = groups.map((value) => escapeHTML(value?.trim() ?? ''));

            if (!EDEN_TEMPLATE_HTML) {
                return null;
            }

            const html = applyEdenTemplatePlaceholders(EDEN_TEMPLATE_HTML, normalized);

            const wrapper = doc.createElement('div');
            wrapper.innerHTML = html.trim();

            const fragment = doc.createDocumentFragment();
            while (wrapper.firstChild) {
                fragment.appendChild(wrapper.firstChild);
            }

            return fragment;
        },
    },

    {
        id: 'bhl-system',
        pattern: /\+(.*?)\+/g,
        createNode({ documentRef, groups }) {
            const [message = ''] = groups;
            const doc = documentRef || defaultDocument;
            if (!doc) return null;
            const container = doc.createElement('div');
            container.style.textAlign = 'center';
            container.style.color = '#888888';
            container.style.fontSize = '14px';
            container.style.margin = '10px 0';
            container.textContent = `系统提示：${message.trim()}`;
            return container;
        },
    },
    {
        id: 'bhl-recall',
        pattern: /^-(.*?)-$/gm,
        createNode({ documentRef, groups }) {
            const [message = ''] = groups;
            const doc = documentRef || defaultDocument;
            if (!doc) return null;
            const outer = doc.createElement('div');
            outer.style.textAlign = 'center';
            outer.style.marginBottom = '6px';

            const details = doc.createElement('details');
            details.style.display = 'inline-block';

            const summary = doc.createElement('summary');
            summary.style.color = '#999999';
            summary.style.fontStyle = 'italic';
            summary.style.fontSize = '13px';
            summary.style.cursor = 'pointer';
            summary.style.listStyle = 'none';
            summary.style.webkitTapHighlightColor = 'transparent';
            summary.textContent = '对方撤回了一条消息';

            const content = doc.createElement('div');
            content.style.padding = '8px 12px';
            content.style.marginTop = '8px';
            content.style.backgroundColor = 'rgba(0,0,0,0.04)';
            content.style.borderRadius = '10px';
            content.style.textAlign = 'left';

            const paragraph = doc.createElement('p');
            paragraph.style.margin = '0';
            paragraph.style.color = '#555';
            paragraph.style.fontStyle = 'normal';
            paragraph.style.fontSize = '14px';
            paragraph.style.lineHeight = '1.4';
            paragraph.textContent = message.trim();

            content.appendChild(paragraph);
            details.appendChild(summary);
            details.appendChild(content);
            outer.appendChild(details);

            return outer;
        },
    },
];

function clonePattern(pattern) {
    if (!(pattern instanceof RegExp)) return null;
    return new RegExp(pattern.source, pattern.flags);
}

function isInsideRegexNode(node) {
    let current = node;
    while (current) {
        if (current.nodeType === 1 && current.dataset?.cipRegexNode === '1') {
            return true;
        }
        current = current.parentNode;
    }
    return false;
}

function collectTextNodes(root, documentRef) {
    const doc = documentRef || defaultDocument;
    if (!root || !doc?.createTreeWalker) return [];

    const nodes = [];
    const walker = doc.createTreeWalker(root, TEXT_NODE_FILTER);
    while (walker.nextNode()) {
        const current = walker.currentNode;
        if (!current || !current.nodeValue) continue;
        if (isInsideRegexNode(current.parentNode)) continue;
        nodes.push(current);
    }
    return nodes;
}

function markRegexNode(node, ruleId) {
    if (!node) return;
    if (node.nodeType === 11) {
        const elements = node.children || [];
        for (const child of elements) {
            markRegexNode(child, ruleId);
        }
        return;
    }

    if (node.nodeType !== 1) return;
    node.dataset.cipRegexNode = '1';
    node.dataset.cipRegexRule = ruleId || '';
}

function replaceMatchesInTextNode({
    textNode,
    rule,
    documentRef,
    ensureOriginalStored,
}) {
    if (!textNode?.parentNode) return false;
    const text = textNode.nodeValue;
    if (!text) return false;

    const doc = documentRef || defaultDocument;
    if (!doc) return false;

    const pattern = clonePattern(rule.pattern);
    if (!pattern) return false;

    let match;
    let lastIndex = 0;
    let replaced = false;
    const fragment = doc.createDocumentFragment();

    pattern.lastIndex = 0;

    while ((match = pattern.exec(text)) !== null) {
        const matchText = match[0];
        if (!matchText) {
            if (pattern.lastIndex === match.index) {
                pattern.lastIndex++;
            }
            continue;
        }

        const startIndex = match.index;
        if (startIndex > lastIndex) {
            fragment.appendChild(
                doc.createTextNode(text.slice(lastIndex, startIndex)),
            );
        }

        const replacementNode = rule.createNode({
            documentRef: doc,
            groups: match.slice(1),
        });

        if (replacementNode) {
            markRegexNode(replacementNode, rule.id);
            fragment.appendChild(replacementNode);
            replaced = true;
        } else {
            fragment.appendChild(doc.createTextNode(matchText));
        }

        lastIndex = startIndex + matchText.length;

        if (pattern.lastIndex === match.index) {
            pattern.lastIndex++;
        }
    }

    if (!replaced) {
        return false;
    }

    if (lastIndex < text.length) {
        fragment.appendChild(doc.createTextNode(text.slice(lastIndex)));
    }

    if (typeof ensureOriginalStored === 'function') {
        ensureOriginalStored();
    }

    textNode.parentNode.replaceChild(fragment, textNode);
    return true;
}

function clearAppliedFlag(element) {
    if (!element?.dataset) return;
    delete element.dataset.cipRegexApplied;
}

function markApplied(element) {
    if (!element?.dataset) return;
    element.dataset.cipRegexApplied = '1';
}

function restoreOriginal(element) {
    if (!element) return false;
    const original = originalContentMap.get(element);
    if (typeof original !== 'string') return false;
    element.innerHTML = original;
    originalContentMap.delete(element);
    clearAppliedFlag(element);
    return true;
}

export function getRegexEnabled() {
    try {
        if (typeof localStorage === 'undefined') {
            return DEFAULT_REGEX_ENABLED;
        }
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === null) return DEFAULT_REGEX_ENABLED;
        return stored === 'true';
    } catch (error) {
        console.warn('胡萝卜插件：读取正则开关失败', error);
        return DEFAULT_REGEX_ENABLED;
    }
}

export function setRegexEnabled(enabled) {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    } catch (error) {
        console.warn('胡萝卜插件：写入正则开关失败', error);
    }
}

export function applyRegexReplacements(element, options = {}) {
    if (!element) return false;

    const {
        enabled = true,
        documentRef = defaultDocument,
    } = options;

    if (!enabled) {
        return restoreOriginal(element);
    }

    if (!documentRef) {
        return false;
    }

    let replacedAny = false;
    let storedOriginal = false;

    const ensureOriginalStored = () => {
        if (storedOriginal) return;
        originalContentMap.set(element, element.innerHTML);
        storedOriginal = true;
    };

    for (const rule of REGEX_RULES) {
        const textNodes = collectTextNodes(element, documentRef);
        if (!textNodes.length) break;

        for (const textNode of textNodes) {
            const replaced = replaceMatchesInTextNode({
                textNode,
                rule,
                documentRef,
                ensureOriginalStored,
            });
            if (replaced) {
                replacedAny = true;
            }
        }
    }

    if (replacedAny) {
        markApplied(element);
        return true;
    }

    if (element?.dataset?.cipRegexApplied) {
        if (!originalContentMap.has(element)) {
            clearAppliedFlag(element);
            return false;
        }
        return true;
    }

    return false;
}

export default {
    applyRegexReplacements,
    getRegexEnabled,
    setRegexEnabled,
};

export function restoreRegexOriginal(element) {
    return restoreOriginal(element);
}

export function clearRegexState(element) {
    clearAppliedFlag(element);
    restoreOriginal(element);
}

export function getRegexRules() {
    return REGEX_RULES.slice();
}