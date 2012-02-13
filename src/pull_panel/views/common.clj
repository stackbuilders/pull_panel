(ns pull-panel.views.common
  (:use [noir.core :only [defpartial]]
        [hiccup.page-helpers :only [include-css include-js html5]])
  (:require [noir.session :as session] ))

(defpartial site-layout [& content]
  (html5
   [:head
    [:title "Pull Panel"]
    [:meta {:name "viewport" :content "width=device-width, initial-scale=1.0"}]
    (include-css "css/bootstrap.css")
    (include-css "css/application.css")
    (include-css "css/bootstrap-responsive.css")
    (include-js "js/jquery-1.7.1.min.js")
    (include-js "js/bootstrap.js")]
   [:body
    [:div.navbar.navbar-fixed-top
     [:div.navbar-inner
      [:div.container
       [:div.brand [:a {:href "/"} "Pull Panel"]]
       [:div.navbar-text.pull-right
        (if (session/get :token)
          [:a {:href "/logout"} "Log out"]
          [:a {:href "/auth/github"} "Log in now"]
          )
        ]]]]
    [:div.container
     [:div.hero-unit
      [:div.row
       [:div.span-12
        [:p (session/flash-get)]
        content]]]]
    [:div.container
     [:footer
      [:p "© Stack Builders 2012"]]]]))
