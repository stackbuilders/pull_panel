# pullpanel

View github pull requests for multiple repositories in several repos
on one screen.

## Usage

You must first register this as a github application in order to use Oauth, and set environment variables
for GITHUB_CLIENT_ID and GITHUB_SECRET. For development mode you have to set your app "Callback URL" on GitHub
to `http://lvh.me:8080`. This domain points to `127.0.0.1` and OAuth integration becomes a piece of cake.

```bash
lein deps
GITHUB_CLIENT_ID=XXX GITHUB_SECRET=XXX lein run
```

## License

Copyright (C) 2012 Justin Leitgeb

Distributed under the Eclipse Public License, the same as Clojure.


