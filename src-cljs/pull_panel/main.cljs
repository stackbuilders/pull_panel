(ns pull_panel.main)

(def jquery (js* "$"))

(jquery
   (fn []
     (-> (jquery "div.meat")
         (.html "This is a test!!!!")
         (.append "<div>Look here!</div>"))))

; (js/alert "Hello from ClojureScript!")
