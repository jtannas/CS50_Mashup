# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
#   Desc.:      
#   Purpose:    
#   Author:     Joel Tannas
#   Date:       Feb 16, 2017
#   
#   Licensing Info:
#   None
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------

# Imports:
import feedparser
import urllib.parse

# Functions:

# ---------------------------------------------------------------------------
#   Desc.:      function lookup ( geo as string )
#   Purpose:    Looks up a news RSS for a provided geographic location
#   Author:     CS50    /   reformatted by Joel Tannas
#   Date:       ?       /   Feb 16, 2017
#
#   Bugs, Limitations, and Other Notes:
#   - 
# ---------------------------------------------------------------------------
def lookup(geo):
    """Looks up articles for geo."""

    # check cache for geo
    if geo in lookup.cache:
        return lookup.cache[geo]

    # get feed from Google
    feed = feedparser.parse("http://news.google.com/news?geo={}&output=rss".format(urllib.parse.quote(geo, safe="")))

    # if no items in feed, get feed from Onion
    if not feed["items"]:
        feed = feedparser.parse("http://www.theonion.com/feeds/rss")

    # cache results
    lookup.cache[geo] = [{"link": item["link"], "title": item["title"]} for item in feed["items"]]

    # return results
    return lookup.cache[geo]

# initialize cache
lookup.cache = {}
