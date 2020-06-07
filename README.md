# Pre-release

I started this but it's not finished.

# Generate Podspec

Generate a podspec for your SwiftPM project based on tagged releases.

# Why?

You have all this metadata already, why force yourself to do an additional
step when making releases when you could deploy continuously?

# How

1. Add a new workflow (eg `.github/workflows/release.yml`) like this:
    ```yaml
    name: Push to CocoaPods Trunk
    on:
      release:
        types:
        - created
    jobs:
      build:
        runs-on: macos-latest  # comes with CocoaPods, use Ubuntu if you like, but you have to install it yourself
        steps:
        - uses: mxcl/generate-podspec@v1
          id: podspec
          with:
            author: Joe Smith
            author-email: ${{ secrets.email }}  # doesn’t have to be a secret
            token: ${{ github.token }}  # you get this automatically, but it must be passed
            swift-versions: '4.2, 5.0'  # GitHub Actions don’t support arrays currently
        - run: pod trunk push
          env: 
            COCOAPODS_TRUNK_TOKEN: ${{ secrets.COCOAPODS_TRUNK_TOKEN }}
            # ^^ CocoaPods docs tell you how to get this (from your .netrc)
        # optionally attach the podspec as a build artifact
        - uses: actions/upload-artifact@v2
          with:
            name: podspec
            path: ${{ steps.output.podspec.name }}
    ```
2. Tag a release at https://github.com/your/repo/releases

We determine as many podspec fields as possible:

* `version`: from the release name or release tag, whichever *first* passes as a semantic-version (`v` prefix allowed)
* `license`: we ask GitHub what license you use
* `summary`: we grab your repo description
* `homepage`: the repo GitHub page

# Inputs

|---------------|---------------|---------------|
| Key           | Required      | Description   |
|---------------|---------------|---------------|
| `author`      | ✓           | eg. Max Howell |
| `author-email`| ✓           | eg. max.howell@example.com |
| `swift-versions` |  | eg. `4.2, 5.0` |
| `macOS-deployment-target` |  | eg. 10.10 |
| `iOS-deployment-target` |  |  |
| `tvOS-deployment-target` |  | | 
| `watchOS-deployment-target` |  |  |
|---------------|---------------|---------------|

We require both author and author-email as there is no reliable way we can get those
from the environment unfortunately.

# Caveats

* We assume your sources are in `Sources`, if yours are not, you cannot currently
  use this action, but you could fork and fix.

# TODO

We could probably get swift-versions from your `Package.swift` manifest,
feel free to PR.

# I Need More Complexity

If you need more complexity then probably you want a different action that
will work with a Podspec template, or modify your existing Podspec
automatically. This is outside of the scope for this project.
