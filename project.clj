(defproject pull-panel "0.1.0-SNAPSHOT"
            :description "Quick view of github pull requests across projects"
            :dependencies [[org.clojure/clojure "1.3.0"]
                           [noir "1.2.2"]
                           [clj-http "0.3.5"]
                           [postgresql/postgresql "9.1-901-1.jdbc4"]
                           [org.clojure/java.jdbc "0.2.0"]]
            :plugins [[lein-cljsbuild "0.1.8"]]
            :cljsbuild {
            :builds [{
              ; The path to the top-level ClojureScript source directory:
              :source-path "src-cljs"
              ; The standard ClojureScript compiler options:
              ; (See the ClojureScript compiler documentation for details.)
              :compiler {
                :optimizations :whitespace
                :output-to "resources/public/js/main.js"
                :pretty-print true}}]}
            :main pull-panel.server)

