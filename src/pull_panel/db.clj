(ns pull-panel.db
  (:require [clojure.java.jdbc :as sql]))

(defn database-url []
  (get (System/getenv) "DATABASE_URL"))

(defn all []
  (sql/with-connection (database-url)
    (sql/with-query-results results
      ["SELECT * FROM watches ORDER BY id DESC"]
      (into [] results))))

(defn delete [id]
  (sql/with-connection (database-url)
    (sql/delete-rows :watches ["id=?" id])))

(defn create [username owner repo]
  (sql/with-connection (database-url)
    (sql/insert-values :watches [:username :owner :repo] [username owner repo])))

(defn create-watches-schema []
  (sql/with-connection (database-url)
    (sql/create-table :watches
                      [:id :serial "PRIMARY KEY"]
                      [:username :varchar "NOT NULL"]
                      [:owner :varchar "NOT NULL"]
                      [:repo :varchar "NOT NULL"]
                      [:created_at :timestamp "NOT NULL" "DEFAULT CURRENT_TIMESTAMP"])))
