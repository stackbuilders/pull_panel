(ns pull-panel.views.common
  (:use [noir.core :only [defpartial]]
        [hiccup.page-helpers :only [include-css html5]]))

(defpartial site-layout [& content]
  (html5
    [:head
      [:title "my site"]]
    [:body
      [:div#wrapper
        content]]))
