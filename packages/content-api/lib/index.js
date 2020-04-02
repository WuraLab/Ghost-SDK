// es6 import statement
import axios from 'axios';

const supportedVersions = ['v2', 'v3', 'canary']; // ghost versions

//  es6 export statement
// using babel es6 and upwards  to convert to es5
export default function GhostContentAPI({url, host, ghostPath = 'ghost', version, key}) {
    // host parameter is deprecated
    // function GhostContentAPI accepts {} obj as arguement
    // default property, ghostPath = 'ghost'
    // url, key, version
    // recall the content api is readonly i.e one-way interaction

    // this condition handles error , if the error host ppt isnt parsed
    // logs an error message
    // and reassign the host ppt to url arguement

    if (host) {
        // eslint-disable-next-line
        console.warn('GhostAdminAPI\'s `host` parameter is deprecated, please use `url` instead');
        if (!url) {
            url = host;
        }
    }

    // returns the instance of the GhostContentAPI function
    if (this instanceof GhostContentAPI) {
        return GhostContentAPI({url, version, key});
    }
    // another error handler if the version ppt is not parsed
    if (!version) {
        throw new Error('GhostContentAPI Config Missing: @tryghost/content-api requires a "version" like "v2"');
    }

    // // another error handler if the version ppt is version parsed isnt the suportedVersion
    if (!supportedVersions.includes(version)) {
        throw new Error('GhostContentAPI Config Invalid: @tryghost/content-api does not support the supplied version');
    }
    // another error handler if the url ppt is not parsed
    if (!url) {
        throw new Error('GhostContentAPI Config Missing: @tryghost/content-api requires a "url" like "https://site.com" or "https://site.com/blog"');
    }

    // another error handler with regular experessions checker for the protocol of the url ppt
    if (!/https?:\/\//.test(url)) {
        throw new Error('GhostContentAPI Config Invalid: @tryghost/content-api requires a "url" with a protocol like "https://site.com" or "https://site.com/blog"');
    }
    // validations 
    if (url.endsWith('/')) {
        throw new Error('GhostContentAPI Config Invalid: @tryghost/content-api requires a "url" without a trailing slash like "https://site.com" or "https://site.com/blog"');
    }
    if (ghostPath.endsWith('/') || ghostPath.startsWith('/')) {
        throw new Error('GhostContentAPI Config Invalid: @tryghost/content-api requires a "ghostPath" without a leading or trailing slash like "ghost"');
    }
    if (key && !/[0-9a-f]{26}/.test(key)) {
        throw new Error('GhostContentAPI Config Invalid: @tryghost/content-api requires a "key" with 26 hex characters');
    }

    // reduce() as a for loop, that is specifically for using the values of an array to create something new
    // in this case each resource type
    const api = ['posts', 'authors', 'tags', 'pages', 'settings'].reduce((apiObject, resourceType) => {
            // default options are empty obj {}
            //options include objects like page number
            // order of tags
            // limit of page returned
            // 
        function browse(options = {}, memberToken) {
            return makeRequest(resourceType, options, null, memberToken);
        }

        // data could be obj id , slug, 
        // options is set to an empty obj by default
        // options here return methods like count posts, 
         // no memberToken
        function read(data, options = {}, memberToken) {

            // error handler
            //if data arguement isnt parsed
            // return a reject promise with an error missing data
            if (!data) {
                return Promise.reject(new Error('Missing data'));
            }

            // error handler
            // in the data obj, if the id & slug isnt parsed return a reject promise with error 
                // Must include either data.id or data.slug
                
            if (!data.id && !data.slug) {
                return Promise.reject(new Error('Must include either data.id or data.slug'));
            }

            // Add options and data objs to an empty obj
            // assigns params to the obj chain
            const params = Object.assign({}, data, options);

            // resourceType in 'posts', 'authors', 'tags', 'pages', 'settings'
            // data .id or the path to the post 'slug/data.slug'
            // memberToken's not parsed
            return makeRequest(resourceType, params, data.id || `slug/${data.slug}`, memberToken);
        }

            // return the accummulator apiObject
            // 'posts', 'authors', 'tags', 'pages', 'settings'
            // eg. api.tags.read({id: 'abcd1234'});
            // To understand what each value accumumulator retuns let's study what the makerequest function does itself 
        return Object.assign(apiObject, {
            [resourceType]: {
                read,
                browse
            }
        });
    }, {});

    delete api.settings.read;

    return api;

    // each resource type represents the currentvalue from the api array like post and tags
    // params are formed when data and options are added together
    // data id
    // membersToken is set to null . it acts an error handler because the membersToken is not parsed

    function makeRequest(resourceType, params, id, membersToken = null) {
        // error handler if the key value is not parsed when GhostContenetAPi is instanciated
        // and it returns reject promise with an error GhostContentAPI Config Missing
        if (!membersToken && !key) {
            return Promise.reject(
                new Error('GhostContentAPI Config Missing: @tryghost/content-api was instantiated without a content key')
            );
        }
        // delete params.id
        // ???
        delete params.id;
        
        // Tenary operator
        // assign GHost memeberToken to headers if true else assign undefined
        const headers = membersToken ? {
            Authorization: `GhostMembers ${membersToken}`
        } : undefined;

        // send get request
        return axios.get(`${url}/${ghostPath}/api/${version}/content/${resourceType}/${id ? id + '/' : ''}`, {
            params: Object.assign({key}, params),
            paramsSerializer: (params) => {
                return Object.keys(params).reduce((parts, key) => {
                    const val = encodeURIComponent([].concat(params[key]).join(','));
                    return parts.concat(`${key}=${val}`);
                }, []).join('&');
            },
            headers
        })    
            
            .then((res) => {
                // if successful and its an associative array return a resourceType key in the res.data array
            if (!Array.isArray(res.data[resourceType])) {
                return res.data[resourceType];
            }
                // if successful and the key resourcetype, which is also an array, return the first index of the resourceType array 
            if (res.data[resourceType].length === 1 && !res.data.meta) {
                return res.data[resourceType][0];
            }
            // 
            return Object.assign(res.data[resourceType], {meta: res.data.meta});
        }).catch((err) => {
            if (err.response && err.response.data && err.response.data.errors) {
                const props = err.response.data.errors[0];
                const toThrow = new Error(props.message);
                const keys = Object.keys(props);

                toThrow.name = props.type;

                keys.forEach((key) => {
                    toThrow[key] = props[key];
                });

                toThrow.response = err.response;

                // @TODO: remove in 2.0. We have enhanced the error handling, but we don't want to break existing implementations.
                toThrow.request = err.request;
                toThrow.config = err.config;

                throw toThrow;
            } else {
                throw err;
            }
        });
    }
}
