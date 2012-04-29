(ns pull-panel.test.models.watch
  (:use [clojure.test])
  (:use [pull-panel.models.watch :as watch]))

(deftest create-test
  (is (= (watch/create "user" "owner" "repo"))))