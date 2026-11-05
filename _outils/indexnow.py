#!/usr/bin/env python3
"""Signale les pages de brasdroitia.com à IndexNow (Bing, Yandex, Seznam…), gratuit.
Usage : python3 _outils/indexnow.py            toutes les URL du sitemap
        python3 _outils/indexnow.py URL [URL…]  seulement ces URL
La clé publique est le fichier /534dd8828207e69f1de06771e537b52a.txt à la racine du site (elle doit être en ligne)."""
import json, re, sys, urllib.request
CLE = "534dd8828207e69f1de06771e537b52a"
HOTE = "brasdroitia.com"
urls = sys.argv[1:] or re.findall(r"<loc>([^<]+)</loc>", open("sitemap.xml", encoding="utf-8").read())
corps = {"host": HOTE, "key": CLE, "keyLocation": f"https://{HOTE}/{CLE}.txt", "urlList": urls[:10000]}
r = urllib.request.Request("https://api.indexnow.org/indexnow", data=json.dumps(corps).encode(),
                           headers={"Content-Type": "application/json; charset=utf-8"})
try:
    print(urllib.request.urlopen(r, timeout=30).status, len(urls), "URL envoyées")
except urllib.error.HTTPError as e:
    print("Erreur", e.code, e.read()[:200])
