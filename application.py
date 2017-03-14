# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
#   Desc.:      Web Application Controller
#   Purpose:    Controlling & Serving the "Mashup" code for pset8 of CS50
#   Author:     CS50    /   Joel Tannas
#   Date:       ?       /   Feb 16, 2017
#   
#   Licensing Info:
#   None
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------
import os
import re
from flask import Flask, jsonify, render_template, request, url_for
from flask_jsglue import JSGlue

from cs50 import SQL
from helpers import lookup

# ---------------------------------------------------------------------------
# Globals
# ---------------------------------------------------------------------------
app = Flask(__name__)
JSGlue(app)

# ---------------------------------------------------------------------------
#   Desc.:      Startup configuration script
#   Purpose:    Configures the application
#   Author:     CS50
#   Date:       ?
#
#   Bugs, Limitations, and Other Notes:
#   - 
# ---------------------------------------------------------------------------
# ensure responses aren't cached
if app.config["DEBUG"]:
    @app.after_request
    def after_request(response):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Expires"] = 0
        response.headers["Pragma"] = "no-cache"
        return response

# configure CS50 Library to use SQLite database
db = SQL("sqlite:///mashup.db")

# ---------------------------------------------------------------------------
#   Desc.:      {{Mysite}} Home Page
#   Purpose:    Renders the main page
#   Author:     CS50
#   Date:       ?
#
#   Bugs, Limitations, and Other Notes:
#   - 
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    """Render map."""
    if not os.environ.get("API_KEY"):
        raise RuntimeError("API_KEY not set")
    return render_template("index.html", key=os.environ.get("API_KEY"))

# ---------------------------------------------------------------------------
#   Desc.:      {{Mysite}}/articles() AS JSON
#   Purpose:    Retrieves articles for a given location
#   Author:     Joel Tannas
#   Date:       Feb 16, 2017
#
#   Bugs, Limitations, and Other Notes:
#   - http://docs.cs50.net/problems/mashup/mashup.html#code-articles-code-2
# ---------------------------------------------------------------------------
@app.route("/articles")
def articles():
    
    # --- Section 010: Validate Input Parameters
    geo = request.args.get("postal_code")
    
    if not geo:
        raise RuntimeError("missing postal code")
    
    # --- Section 020: Use the lookup helper function to retrieve the data
    return jsonify(lookup(geo))

# ---------------------------------------------------------------------------
#   Desc.:      {{Mysite}}/search() AS JSON
#   Purpose:    Searches the globe for places that match query
#   Author:     Joel Tannas
#   Date:       Feb 16, 2017
#
#   Bugs, Limitations, and Other Notes:
#   - http://docs.cs50.net/problems/mashup/mashup.html#code-search-code-2
# ---------------------------------------------------------------------------
@app.route("/search")
def search():

    # --- Section 010: Validate the inputs
    q = request.args.get("q") + "%"
    if not q:
        raise RuntimeError("missing query")
    
    # --- Section 020: Query the database for the locations
    rows = db.execute("""SELECT *
        FROM places
        WHERE place_name||", "||admin_name1||", "||postal_code LIKE :q
        OR postal_code LIKE :q
        LIMIT 6""",
        q = q)
        
    # ---
    return jsonify(rows)

# ---------------------------------------------------------------------------
#   Desc.:      {{Mysite}}/Update() AS JSON
#   Purpose:    Finds up to 10 places within the current map view
#   Author:     CS50
#   Date:       ?
#
#   Bugs, Limitations, and Other Notes:
#   - 
# ---------------------------------------------------------------------------
@app.route("/update")
def update():

    # ensure parameters are present
    if not request.args.get("sw"):
        raise RuntimeError("missing sw")
    if not request.args.get("ne"):
        raise RuntimeError("missing ne")

    # ensure parameters are in lat,lng format
    if not re.search("^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$", request.args.get("sw")):
        raise RuntimeError("invalid sw")
    if not re.search("^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$", request.args.get("ne")):
        raise RuntimeError("invalid ne")

    # explode southwest corner into two variables
    (sw_lat, sw_lng) = [float(s) for s in request.args.get("sw").split(",")]

    # explode northeast corner into two variables
    (ne_lat, ne_lng) = [float(s) for s in request.args.get("ne").split(",")]

    # find 10 cities within view, pseudorandomly chosen if more within view
    if (sw_lng <= ne_lng):

        # doesn't cross the antimeridian
        rows = db.execute("""SELECT * FROM places
            WHERE :sw_lat <= latitude AND latitude <= :ne_lat AND (longitude >= :sw_lng AND longitude <= :ne_lng)
            GROUP BY country_code, place_name, admin_code1
            ORDER BY RANDOM()
            LIMIT 10""",
            sw_lat=sw_lat, ne_lat=ne_lat, sw_lng=sw_lng, ne_lng=ne_lng)

    else:

        # crosses the antimeridian
        rows = db.execute("""SELECT * FROM places
            WHERE :sw_lat <= latitude AND latitude <= :ne_lat AND (longitude >= :sw_lng OR longitude <= :ne_lng)
            GROUP BY country_code, place_name, admin_code1
            ORDER BY RANDOM()
            LIMIT 10""",
            sw_lat=sw_lat, ne_lat=ne_lat, sw_lng=sw_lng, ne_lng=ne_lng)
        
    # output places as JSON
    return jsonify(rows)