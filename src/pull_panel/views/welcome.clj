(ns pull-panel.views.welcome
  (:require [pull-panel.views.common :as common])
  (:use [noir.core :only [defpage]]
        [hiccup.core :only [html]])
  (:require [noir.response :as resp]
            [clj-http.client :as client]
            [noir.session :as session]
            [clj-json.core :as json]
            [clojure.set :as set]
            [hiccup.form-helpers :as form]
            [hiccup.page-helpers :as page-helpers]))

(defpage "/repos/delete" {:keys [user repo]}
  (session/put! :repos (remove #{[user repo]} (session/get :repos)))
  (session/flash-put! (str "Deleted repo " user "/" repo) )
  (resp/redirect "/"))



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
   [:a {:href (str "/repos/delete?user=" org "&repo=" repo "&token=" token) } "(Unwatch)"]
   [:span.pulls (format-pull-structure pulls) ]
])

(defn pulls-for [user repo token]
  (let [pull-url (str "https://api.github.com/repos/" user "/" repo "/pulls?access_token=" token)]
    [user repo (json/parse-string ((client/get pull-url {:accept :json :throw-exceptions false}) :body))]))

(defn all-pulls [repos token]
  (map #(pulls-for (first %) (last %) token) repos))

(defn new-repo-form []
  "Form for adding a new repo to polled collection"
  (form/form-to [:post "/repos"]
                [:p
                 (form/label "user" "User / Organization")
                 (form/text-field "user")] 
                
                [:p
                 (form/label "repo" "Repository")
                 (form/text-field "repo")
                 ]
                (form/submit-button "Submit")))

(defn repo-html-list [repos token]
  (if (empty? repos)
    [:p "Add some repos and we'll show you Pull Requests."]
    (page-helpers/unordered-list
     (map #(linked-repo (% 0) (% 1) (% 2) (session/get :token))
          (all-pulls
           (session/get :repos)
           (session/get :token))))))

(defpage "/" []
  (common/site-layout
   [:h1 "Pull Panel"]
   [:hr]
   (if (session/get :token)
     [:span.repos
      (repo-html-list (session/get :repos) (session/get :token))
      [:hr]
      [:h2 "Add a new repo"]
      (new-repo-form)]
     [:p "You must log in to use Pull Panel."])))

(defpage "/auth/github" []
  (resp/redirect
   (str "https://github.com/login/oauth/authorize?"
        "client_id=666cd88453afcf920804&"
        "redirect_uri=https://pullpanel.herokuapp.com/auth/github-callback&"
        "scope=repo")))



(defn delete-repo-form [user repo]
  "Form to delete a repo"
  (form/form-to [:delete "/repos"]
                (form/hidden-field "user" user)
                (form/hidden-field "repo" repo)
                (form/submit-button "Unwatch")))

(defpage [:post "/repos"] {:keys [user repo]}
  (session/put! :repos (set/union (session/get :repos) #{[user repo]}))
  (session/flash-put! (str "Added repo " user "/" repo) )
  (resp/redirect "/"))

(defpage "/logout" []
  (session/clear!)
  (session/flash-put! "You have been logged out")
  (resp/redirect "/"))

(defpage "/set-token" {:keys [token]}
  "Hacky for testing: set the API token given to your app for local testing"
  (session/put! :token token)
  (session/flash-put! (str "Set token to " token) )
  (resp/redirect "/"))

(defpage "/auth/github-callback" {:keys [code]}
  (let [res (client/post "https://github.com/login/oauth/access_token"
                         {:form-params {:client_id "666cd88453afcf920804"
                                        :client_secret "7847bee8ba503fadb9b6f65d1dce4fbf4d336762"
                                        :code code }
                          :accept :json})]
    ((session/put! :token ((json/parse-string (res :body)) "access_token"))
     (session/flash-put! (str "Github user session created" ))
     (resp/redirect "/"))))