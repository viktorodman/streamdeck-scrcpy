import streamDeck from "@elgato/streamdeck";

import { MirrorDevice } from "./actions/mirror-device";

streamDeck.actions.registerAction(new MirrorDevice());

streamDeck.connect();
