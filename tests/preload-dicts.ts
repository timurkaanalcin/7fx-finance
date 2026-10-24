/** Test-only: install every public locale. The app loads these on demand. */
import { installDict } from "../src/lib/i18n/dictionaries";
import { ar } from "../src/lib/i18n/dictionaries/ar";
import { de } from "../src/lib/i18n/dictionaries/de";
import { ru } from "../src/lib/i18n/dictionaries/ru";
import { tr } from "../src/lib/i18n/dictionaries/tr";

installDict("ar", ar);
installDict("de", de);
installDict("ru", ru);
installDict("tr", tr);
