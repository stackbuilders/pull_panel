(ns pull-panel.views.welcome
  (:require [pull-panel.views.common :as common])
  (:use [noir.core :only [defpage]]
        [hiccup.core :only [html]]))

(defpage "/" []
  (common/site-layout
   [:h1 "Github Pull Panel"]
   [:p "Pull your projects"]))


(defpage "/log-in" []
  (common/site-layout
   [:h1 "Log in to Github"]
   [:p "Log in first"])
  )