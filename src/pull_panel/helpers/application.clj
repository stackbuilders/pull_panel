(ns pull-panel.helpers.application
  (:use [hiccup.core :only [html]])
  (:require [hiccup.page-helpers :as page-helpers]
            [hiccup.form-helpers :as form]))

(defn pull-list [pulls]
  (page-helpers/ordered-list (map #(page-helpers/link-to (% "html_url") (% "body")) pulls)))

(defn format-pull-structure [pulls]
  (if (map? pulls)
    pulls
    (if (empty? pulls)
      " No open pulls"
      (pull-list pulls))))

(defn linked-repo [org repo pulls token]
  [:p
   [:a {:href (str "https://github.com/" org "/" repo)} org "/" repo " "]
   [:a {:href (str "/repos?user=" org "&repo=" repo "&token=" token "&_method=DELETE" ) } "(Unwatch)"]
   [:span.pulls (format-pull-structure pulls)]])

(defn repo-html-list [repos token all-pulls all-watches]
  (if (empty? repos)
    [:p "Add some repos and we'll show you Pull Requests."]
    (page-helpers/unordered-list
     (map #(linked-repo (% 0) (% 1) (% 2) token) all-pulls))))

(defn new-repo-form []
  (form/form-to [:post "/repos"]
                [:p
                 (form/label "user" "User / Organization")
                 (form/text-field "user")]

                [:p
                 (form/label "repo" "Repository")
                 (form/text-field "repo")
                 ]
                (form/submit-button "Submit")))

