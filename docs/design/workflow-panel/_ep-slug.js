/* _ep-slug.js — the ONE rule that turns an endpoint's name into the name of its facts file (D-035).

   THE RULE: take the endpoint's label "METHOD /path" (the feed's own spelling, e.g. "GET /recipes/{recipe_id}"),
   lowercase it, turn every run of characters that are not a-z or 0-9 into ONE "-", and drop a "-" at either end.
       "POST /setup/complete"         → post-setup-complete
       "GET /recipes/{recipe_id}"     → get-recipes-recipe-id
   The facts of that endpoint live in _eps/<slug>.js (a LOCAL build, git-ignored — gen-endpoint-set.py writes it),
   and the lab opens it with endpoint-lab.html?ep=<slug>.

   Every reader imports THIS file and nothing restates the rule:
     · endpoint-lab.html and all-endpoints.html load it by a script tag (window.EPSLUG);
     · gen-endpoint-set.py runs it under node (module.exports) to name the files it writes, and stops the build when
       two endpoints would share a slug.
   `valid` is the lab's gate on ?ep=: a slug that could not come out of the rule is never turned into a path. */
(function(root){
  function slug(label){
    return String(label == null ? "" : label).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
  function valid(s){ return typeof s === "string" && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s); }
  function file(s){ return "_eps/" + s + ".js"; }
  var api = { slug: slug, valid: valid, file: file };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.EPSLUG = api;
})(typeof window !== "undefined" ? window : this);
