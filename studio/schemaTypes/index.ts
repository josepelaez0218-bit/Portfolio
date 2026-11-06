import {about} from './about'
import {labItem} from './labItem'
import {localeString, localeText} from './locale'
import {project} from './project'
import {sectionBlock} from './sectionBlock'
import {siteTexts} from './siteTexts'

// about and labItem are no longer on the web; they stay registered so their
// old documents still open, but they're out of the Studio's menu
export const schemaTypes = [siteTexts, project, sectionBlock, localeString, localeText, about, labItem]
