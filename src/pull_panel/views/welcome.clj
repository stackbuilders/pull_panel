(ns pull-panel.views.welcome
  (:use [noir.core :only [defpage]])
  (:require [noir.response :as resp]
            [noir.session :as session]
            [pull-panel.github :as github]
            [pull-panel.db :as db]
            [pull-panel.views.common :as common]
            [pull-panel.helpers.application :as helper]))

(defpage [:delete "/repos"] {:keys [id]}
  (db/delete id)
  (session/flash-put! (str "Deleted repo " id))
  (resp/redirect "/"))

(defpage "/" []
  (common/site-layout
   [:h1 "Pull Panel"]
   [:hr]
   [:span.repos
    (helper/repo-html-list (db/all) (session/get :token) (github/all-pulls (db/all) (session/get :token)) (db/all))
    [:hr]
    [:h2 "Add a new repo"]
    (helper/new-repo-form)]))

(defpage "/auth/github" []
  (resp/redirect github/auth-url))

(defpage [:post "/repos"] {:keys [user repo]}
  (db/create (session/get :login) user repo)
  (session/flash-put! (str "Added repo " user "/" repo))
  (resp/redirect "/"))

(defpage "/logout" []
  (session/clear!)
  (session/flash-put! "You have been logged out")
  (resp/redirect "/"))

(defpage "/set-token" {:keys [token]}
  (session/put! :token token)
  (session/flash-put! (str "Set token to " token))
  (resp/redirect "/"))

(defpage "/auth/github-callback" {:keys [code]}
    (session/put! :token (github/fetch-access-token code))
    (session/put! :login (github/fetch-login (session/get :token)))
    (session/flash-put! (str "Github user session created for " (session/get :login)))
    (resp/redirect "/"))
