# Hydrogen's internal fork

We maintain this fork to be able to use it as a dependency in [Chatrix](https://github.com/Automattic/Chatrix) without waiting on upstream to merge PRs. This enables us to use those unmerged PRs in Chatrix right away.

We don't have any intention of supporting this fork outside our own internal usage.

As of now, this uses the following PRs on top of Hydrogen's v0.3.8 release:

- Fix SSO Query params [#950](https://github.com/vector-im/hydrogen-web/pull/950)
- Allow closing room creation and room joining views on small screens [#951](https://github.com/vector-im/hydrogen-web/pull/951)
- Wait for service worker to start before doing anything else [#960](https://github.com/vector-im/hydrogen-web/pull/960)
- Fix normalizing of homeserver [#964](https://github.com/vector-im/hydrogen-web/pull/964)
- Peeking functionality [1037](https://github.com/vector-im/hydrogen-web/pull/1037) and [#7 on this fork](https://github.com/Automattic/hydrogen-web/pull/7)

