import { TAG_FOLDER_DEFAULT_TYPE } from '../../../tags.js';
import { DEFAULT_FILTER_STATE } from '../../../filters.js';
import { uuidv4 } from '../../../utils.js';

const EXTENSION_NAME = 'List All Tags';

/**
 * @typedef {object} Tag - Object representing a tag
 * @property {string} id - The id of the tag (As a kind of has string. This is used whenever the tag is referenced or linked, as the name might change)
 * @property {string} name - The name of the tag
 * @property {string} [folder_type] - The bogus folder type of this tag (based on `TAG_FOLDER_TYPES`)
 * @property {string} [filter_state] - The saved state of the filter chosen of this tag (based on `FILTER_STATES`)
 * @property {number} [sort_order] - A custom integer representing the sort order if tags are sorted
 * @property {string} [color] - The background color of the tag
 * @property {string} [color2] - The foreground color of the tag
 * @property {number} [create_date] - A number representing the date when this tag was created
 *
 * @property {function} [action] - An optional function that gets executed when this tag is an actionable tag and is clicked on.
 * @property {string} [class] - An optional css class added to the control representing this tag when printed. Used for custom tags in the filters.
 * @property {string} [icon] - An optional css class of an icon representing this tag when printed. This will replace the tag name with the icon. Used for custom tags in the filters.
 * @property {string} [title] - An optional title for the tooltip of this tag. If there is no tooltip specified, and "icon" is chosen, the tooltip will be the "name" property.
 */


function getExisting(tagName) {
    const tags = SillyTavern.getContext().tags;
    return tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
}

function createNewTag(tagName) {
    const context = SillyTavern.getContext();
    const tags = context.tags;
    const existing = getExisting(tagName);
    if (existing) return existing;

    const tag = newTagObj(tagName);
    tags.push(tag);
    context.saveSettingsDebounced();
    return tag;
}

function newTagObj(tagName) {
    const tags = SillyTavern.getContext().tags;
    return {
        id: uuidv4(),
        name: tagName,
        folder_type: TAG_FOLDER_DEFAULT_TYPE,
        filter_state: DEFAULT_FILTER_STATE,
        sort_order: Math.max(0, ...tags.map(t => t.sort_order)) + 1,
        color: '',
        color2: '',
        create_date: Date.now(),
    };
}

function registerSlashCommands() {
    const context = SillyTavern.getContext();
    const SlashCommand = context.SlashCommand;
    const SlashCommandParser = context.SlashCommandParser;
    const SlashCommandArgument = context.SlashCommandArgument;
    const ARGUMENT_TYPE = context.ARGUMENT_TYPE;

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'tag-new',
        returns: 'created: true/false',
        callback: (args, tagName) => {
            if (!tagName) return 'false';
            const tag = getExisting(tagName);
            if (!tag) {
                createNewTag(String(tagName));
                return 'true';
            }
            return 'false';
        },
        unnamedArgumentList: [
            context.SlashCommandArgument.fromProps({
                description: 'tag name',
                typeList: [ARGUMENT_TYPE.STRING],
                isRequired: true,
            }),
        ],
        helpString: `
        <div>
            Creates a tag.
        </div>
        <div>
            <strong>Example:</strong>
            <ul>
                <li>
                    <pre><code>/tag-new scenario</code></pre>
                    will add the tag "scenario".
                </li>
            </ul>
        </div>
    `,
    }));

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'tag-exists-all',
        returns: 'true/false',
        callback: (args, tagName) => {
            if (!tagName) return 'false';
            const tag = getExisting(tagName);
            return tag ? 'true' : 'false';
        },
        unnamedArgumentList: [
            SlashCommandArgument.fromProps({
                description: 'tag name',
                typeList: [ARGUMENT_TYPE.STRING],
                isRequired: true,
            }),
        ],
        helpString: `
        <div>
            Checks whether the given tag exists.
        </div>
        <div>
            <strong>Example:</strong>
            <ul>
                <li>
                    <pre><code>/tag-exists-all scenario</code></pre>
                    will return true if the tag "scenario" exists.
                </li>
            </ul>
        </div>
    `,
    }));
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'tag-list-all',
        returns: 'Comma-separated list of all assigned tags',
        callback: () => {
            return context.tags.map(x => x.name).join(', ');
        },
        helpString: `
        <div>
            Lists all tags. Note that there is no special handling for tags containing commas, they will be printed as-is.
        </div>
        <div>
            <strong>Example:</strong>
            <ul>
                <li>
                    <pre><code>/tag-list-all</code></pre>
                    could return something like <code>OC, scenario, edited, funny</code>
                </li>
            </ul>
        </div>
    `,
    }));
}

(async function initExtension() {
    // noinspection DuplicatedCode
    const context = SillyTavern.getContext();
    console.debug(`[${EXTENSION_NAME}]`, context.t`Registering slash commands`);
    registerSlashCommands();
    console.debug(`[${EXTENSION_NAME}]`, context.t`Done`);
})().catch(error => {
    console.error(`[${EXTENSION_NAME}]`, 'Failed to initialize extension', error);
});
