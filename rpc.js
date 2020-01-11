/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.yrpc = (function() {

    /**
     * Namespace yrpc.
     * @exports yrpc
     * @namespace
     */
    var yrpc = {};

    yrpc.ymsg = (function() {

        /**
         * Properties of a ymsg.
         * @memberof yrpc
         * @interface Iymsg
         * @property {number|null} [len] ymsg len
         * @property {number|null} [cmd] ymsg cmd
         * @property {Uint8Array|null} [sid] ymsg sid
         * @property {number|null} [cid] ymsg cid
         * @property {number|null} [no] ymsg no
         * @property {number|null} [res] ymsg res
         * @property {Uint8Array|null} [body] ymsg body
         * @property {string|null} [optstr] ymsg optstr
         * @property {Uint8Array|null} [optbin] ymsg optbin
         * @property {Array.<string>|null} [meta] ymsg meta
         */

        /**
         * Constructs a new ymsg.
         * @memberof yrpc
         * @classdesc Represents a ymsg.
         * @implements Iymsg
         * @constructor
         * @param {yrpc.Iymsg=} [properties] Properties to set
         */
        function ymsg(properties) {
            this.meta = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ymsg len.
         * @member {number} len
         * @memberof yrpc.ymsg
         * @instance
         */
        ymsg.prototype.len = 0;

        /**
         * ymsg cmd.
         * @member {number} cmd
         * @memberof yrpc.ymsg
         * @instance
         */
        ymsg.prototype.cmd = 0;

        /**
         * ymsg sid.
         * @member {Uint8Array} sid
         * @memberof yrpc.ymsg
         * @instance
         */
        ymsg.prototype.sid = $util.newBuffer([]);

        /**
         * ymsg cid.
         * @member {number} cid
         * @memberof yrpc.ymsg
         * @instance
         */
        ymsg.prototype.cid = 0;

        /**
         * ymsg no.
         * @member {number} no
         * @memberof yrpc.ymsg
         * @instance
         */
        ymsg.prototype.no = 0;

        /**
         * ymsg res.
         * @member {number} res
         * @memberof yrpc.ymsg
         * @instance
         */
        ymsg.prototype.res = 0;

        /**
         * ymsg body.
         * @member {Uint8Array} body
         * @memberof yrpc.ymsg
         * @instance
         */
        ymsg.prototype.body = $util.newBuffer([]);

        /**
         * ymsg optstr.
         * @member {string} optstr
         * @memberof yrpc.ymsg
         * @instance
         */
        ymsg.prototype.optstr = "";

        /**
         * ymsg optbin.
         * @member {Uint8Array} optbin
         * @memberof yrpc.ymsg
         * @instance
         */
        ymsg.prototype.optbin = $util.newBuffer([]);

        /**
         * ymsg meta.
         * @member {Array.<string>} meta
         * @memberof yrpc.ymsg
         * @instance
         */
        ymsg.prototype.meta = $util.emptyArray;

        /**
         * Encodes the specified ymsg message. Does not implicitly {@link yrpc.ymsg.verify|verify} messages.
         * @function encode
         * @memberof yrpc.ymsg
         * @static
         * @param {yrpc.Iymsg} message ymsg message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ymsg.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.len != null && message.hasOwnProperty("len"))
                writer.uint32(/* id 1, wireType 5 =*/13).fixed32(message.len);
            if (message.cmd != null && message.hasOwnProperty("cmd"))
                writer.uint32(/* id 2, wireType 5 =*/21).fixed32(message.cmd);
            if (message.sid != null && message.hasOwnProperty("sid"))
                writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.sid);
            if (message.cid != null && message.hasOwnProperty("cid"))
                writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.cid);
            if (message.no != null && message.hasOwnProperty("no"))
                writer.uint32(/* id 5, wireType 0 =*/40).uint32(message.no);
            if (message.res != null && message.hasOwnProperty("res"))
                writer.uint32(/* id 9, wireType 0 =*/72).sint32(message.res);
            if (message.body != null && message.hasOwnProperty("body"))
                writer.uint32(/* id 10, wireType 2 =*/82).bytes(message.body);
            if (message.optstr != null && message.hasOwnProperty("optstr"))
                writer.uint32(/* id 11, wireType 2 =*/90).string(message.optstr);
            if (message.optbin != null && message.hasOwnProperty("optbin"))
                writer.uint32(/* id 12, wireType 2 =*/98).bytes(message.optbin);
            if (message.meta != null && message.meta.length)
                for (var i = 0; i < message.meta.length; ++i)
                    writer.uint32(/* id 13, wireType 2 =*/106).string(message.meta[i]);
            return writer;
        };

        /**
         * Decodes a ymsg message from the specified reader or buffer.
         * @function decode
         * @memberof yrpc.ymsg
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {yrpc.ymsg} ymsg
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ymsg.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.yrpc.ymsg();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.len = reader.fixed32();
                    break;
                case 2:
                    message.cmd = reader.fixed32();
                    break;
                case 3:
                    message.sid = reader.bytes();
                    break;
                case 4:
                    message.cid = reader.uint32();
                    break;
                case 5:
                    message.no = reader.uint32();
                    break;
                case 9:
                    message.res = reader.sint32();
                    break;
                case 10:
                    message.body = reader.bytes();
                    break;
                case 11:
                    message.optstr = reader.string();
                    break;
                case 12:
                    message.optbin = reader.bytes();
                    break;
                case 13:
                    if (!(message.meta && message.meta.length))
                        message.meta = [];
                    message.meta.push(reader.string());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return ymsg;
    })();

    yrpc.Yempty = (function() {

        /**
         * Properties of a Yempty.
         * @memberof yrpc
         * @interface IYempty
         */

        /**
         * Constructs a new Yempty.
         * @memberof yrpc
         * @classdesc Represents a Yempty.
         * @implements IYempty
         * @constructor
         * @param {yrpc.IYempty=} [properties] Properties to set
         */
        function Yempty(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Encodes the specified Yempty message. Does not implicitly {@link yrpc.Yempty.verify|verify} messages.
         * @function encode
         * @memberof yrpc.Yempty
         * @static
         * @param {yrpc.IYempty} message Yempty message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Yempty.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Decodes a Yempty message from the specified reader or buffer.
         * @function decode
         * @memberof yrpc.Yempty
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {yrpc.Yempty} Yempty
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Yempty.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.yrpc.Yempty();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return Yempty;
    })();

    yrpc.Ynocare = (function() {

        /**
         * Properties of a Ynocare.
         * @memberof yrpc
         * @interface IYnocare
         */

        /**
         * Constructs a new Ynocare.
         * @memberof yrpc
         * @classdesc Represents a Ynocare.
         * @implements IYnocare
         * @constructor
         * @param {yrpc.IYnocare=} [properties] Properties to set
         */
        function Ynocare(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Encodes the specified Ynocare message. Does not implicitly {@link yrpc.Ynocare.verify|verify} messages.
         * @function encode
         * @memberof yrpc.Ynocare
         * @static
         * @param {yrpc.IYnocare} message Ynocare message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Ynocare.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Decodes a Ynocare message from the specified reader or buffer.
         * @function decode
         * @memberof yrpc.Ynocare
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {yrpc.Ynocare} Ynocare
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Ynocare.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.yrpc.Ynocare();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return Ynocare;
    })();

    yrpc.Ylogin = (function() {

        /**
         * Properties of a Ylogin.
         * @memberof yrpc
         * @interface IYlogin
         * @property {number|null} [type] Ylogin type
         * @property {string|null} [name] Ylogin name
         * @property {number|null} [passwordEncrypt] Ylogin passwordEncrypt
         * @property {string|null} [passwordHash] Ylogin passwordHash
         * @property {string|null} [sys] Ylogin sys
         * @property {string|null} [time] Ylogin time
         */

        /**
         * Constructs a new Ylogin.
         * @memberof yrpc
         * @classdesc Represents a Ylogin.
         * @implements IYlogin
         * @constructor
         * @param {yrpc.IYlogin=} [properties] Properties to set
         */
        function Ylogin(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Ylogin type.
         * @member {number} type
         * @memberof yrpc.Ylogin
         * @instance
         */
        Ylogin.prototype.type = 0;

        /**
         * Ylogin name.
         * @member {string} name
         * @memberof yrpc.Ylogin
         * @instance
         */
        Ylogin.prototype.name = "";

        /**
         * Ylogin passwordEncrypt.
         * @member {number} passwordEncrypt
         * @memberof yrpc.Ylogin
         * @instance
         */
        Ylogin.prototype.passwordEncrypt = 0;

        /**
         * Ylogin passwordHash.
         * @member {string} passwordHash
         * @memberof yrpc.Ylogin
         * @instance
         */
        Ylogin.prototype.passwordHash = "";

        /**
         * Ylogin sys.
         * @member {string} sys
         * @memberof yrpc.Ylogin
         * @instance
         */
        Ylogin.prototype.sys = "";

        /**
         * Ylogin time.
         * @member {string} time
         * @memberof yrpc.Ylogin
         * @instance
         */
        Ylogin.prototype.time = "";

        /**
         * Encodes the specified Ylogin message. Does not implicitly {@link yrpc.Ylogin.verify|verify} messages.
         * @function encode
         * @memberof yrpc.Ylogin
         * @static
         * @param {yrpc.IYlogin} message Ylogin message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Ylogin.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.type != null && message.hasOwnProperty("type"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.type);
            if (message.name != null && message.hasOwnProperty("name"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
            if (message.passwordEncrypt != null && message.hasOwnProperty("passwordEncrypt"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.passwordEncrypt);
            if (message.passwordHash != null && message.hasOwnProperty("passwordHash"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.passwordHash);
            if (message.sys != null && message.hasOwnProperty("sys"))
                writer.uint32(/* id 5, wireType 2 =*/42).string(message.sys);
            if (message.time != null && message.hasOwnProperty("time"))
                writer.uint32(/* id 6, wireType 2 =*/50).string(message.time);
            return writer;
        };

        /**
         * Decodes a Ylogin message from the specified reader or buffer.
         * @function decode
         * @memberof yrpc.Ylogin
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {yrpc.Ylogin} Ylogin
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Ylogin.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.yrpc.Ylogin();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.type = reader.int32();
                    break;
                case 2:
                    message.name = reader.string();
                    break;
                case 3:
                    message.passwordEncrypt = reader.int32();
                    break;
                case 4:
                    message.passwordHash = reader.string();
                    break;
                case 5:
                    message.sys = reader.string();
                    break;
                case 6:
                    message.time = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return Ylogin;
    })();

    yrpc.UnixTime = (function() {

        /**
         * Properties of an UnixTime.
         * @memberof yrpc
         * @interface IUnixTime
         * @property {Long|null} [timeUnix] UnixTime timeUnix
         * @property {string|null} [timeStr] UnixTime timeStr
         */

        /**
         * Constructs a new UnixTime.
         * @memberof yrpc
         * @classdesc Represents an UnixTime.
         * @implements IUnixTime
         * @constructor
         * @param {yrpc.IUnixTime=} [properties] Properties to set
         */
        function UnixTime(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * UnixTime timeUnix.
         * @member {Long} timeUnix
         * @memberof yrpc.UnixTime
         * @instance
         */
        UnixTime.prototype.timeUnix = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * UnixTime timeStr.
         * @member {string} timeStr
         * @memberof yrpc.UnixTime
         * @instance
         */
        UnixTime.prototype.timeStr = "";

        /**
         * Encodes the specified UnixTime message. Does not implicitly {@link yrpc.UnixTime.verify|verify} messages.
         * @function encode
         * @memberof yrpc.UnixTime
         * @static
         * @param {yrpc.IUnixTime} message UnixTime message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        UnixTime.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.timeUnix != null && message.hasOwnProperty("timeUnix"))
                writer.uint32(/* id 1, wireType 0 =*/8).sint64(message.timeUnix);
            if (message.timeStr != null && message.hasOwnProperty("timeStr"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.timeStr);
            return writer;
        };

        /**
         * Decodes an UnixTime message from the specified reader or buffer.
         * @function decode
         * @memberof yrpc.UnixTime
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {yrpc.UnixTime} UnixTime
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        UnixTime.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.yrpc.UnixTime();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.timeUnix = reader.sint64();
                    break;
                case 2:
                    message.timeStr = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return UnixTime;
    })();

    yrpc.natsOption = (function() {

        /**
         * Properties of a natsOption.
         * @memberof yrpc
         * @interface InatsOption
         * @property {Uint8Array|null} [origSid] natsOption origSid
         * @property {number|null} [origCid] natsOption origCid
         * @property {string|null} [reply] natsOption reply
         * @property {Uint8Array|null} [obin] natsOption obin
         */

        /**
         * Constructs a new natsOption.
         * @memberof yrpc
         * @classdesc Represents a natsOption.
         * @implements InatsOption
         * @constructor
         * @param {yrpc.InatsOption=} [properties] Properties to set
         */
        function natsOption(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * natsOption origSid.
         * @member {Uint8Array} origSid
         * @memberof yrpc.natsOption
         * @instance
         */
        natsOption.prototype.origSid = $util.newBuffer([]);

        /**
         * natsOption origCid.
         * @member {number} origCid
         * @memberof yrpc.natsOption
         * @instance
         */
        natsOption.prototype.origCid = 0;

        /**
         * natsOption reply.
         * @member {string} reply
         * @memberof yrpc.natsOption
         * @instance
         */
        natsOption.prototype.reply = "";

        /**
         * natsOption obin.
         * @member {Uint8Array} obin
         * @memberof yrpc.natsOption
         * @instance
         */
        natsOption.prototype.obin = $util.newBuffer([]);

        /**
         * Encodes the specified natsOption message. Does not implicitly {@link yrpc.natsOption.verify|verify} messages.
         * @function encode
         * @memberof yrpc.natsOption
         * @static
         * @param {yrpc.InatsOption} message natsOption message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        natsOption.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.origSid != null && message.hasOwnProperty("origSid"))
                writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.origSid);
            if (message.origCid != null && message.hasOwnProperty("origCid"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.origCid);
            if (message.reply != null && message.hasOwnProperty("reply"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.reply);
            if (message.obin != null && message.hasOwnProperty("obin"))
                writer.uint32(/* id 4, wireType 2 =*/34).bytes(message.obin);
            return writer;
        };

        /**
         * Decodes a natsOption message from the specified reader or buffer.
         * @function decode
         * @memberof yrpc.natsOption
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {yrpc.natsOption} natsOption
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        natsOption.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.yrpc.natsOption();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.origSid = reader.bytes();
                    break;
                case 2:
                    message.origCid = reader.uint32();
                    break;
                case 3:
                    message.reply = reader.string();
                    break;
                case 4:
                    message.obin = reader.bytes();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return natsOption;
    })();

    return yrpc;
})();

module.exports = $root;
