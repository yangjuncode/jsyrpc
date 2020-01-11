import * as $protobuf from "protobufjs";
/** Namespace yrpc. */
export namespace yrpc {

    /** Properties of a ymsg. */
    interface Iymsg {

        /** ymsg len */
        len?: (number|null);

        /** ymsg cmd */
        cmd?: (number|null);

        /** ymsg sid */
        sid?: (Uint8Array|null);

        /** ymsg cid */
        cid?: (number|null);

        /** ymsg no */
        no?: (number|null);

        /** ymsg res */
        res?: (number|null);

        /** ymsg body */
        body?: (Uint8Array|null);

        /** ymsg optstr */
        optstr?: (string|null);

        /** ymsg optbin */
        optbin?: (Uint8Array|null);

        /** ymsg meta */
        meta?: (string[]|null);
    }

    /** Represents a ymsg. */
    class ymsg implements Iymsg {

        /**
         * Constructs a new ymsg.
         * @param [properties] Properties to set
         */
        constructor(properties?: yrpc.Iymsg);

        /** ymsg len. */
        public len: number;

        /** ymsg cmd. */
        public cmd: number;

        /** ymsg sid. */
        public sid: Uint8Array;

        /** ymsg cid. */
        public cid: number;

        /** ymsg no. */
        public no: number;

        /** ymsg res. */
        public res: number;

        /** ymsg body. */
        public body: Uint8Array;

        /** ymsg optstr. */
        public optstr: string;

        /** ymsg optbin. */
        public optbin: Uint8Array;

        /** ymsg meta. */
        public meta: string[];

        /**
         * Encodes the specified ymsg message. Does not implicitly {@link yrpc.ymsg.verify|verify} messages.
         * @param message ymsg message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: yrpc.Iymsg, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ymsg message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ymsg
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): yrpc.ymsg;
    }

    /** Properties of a Yempty. */
    interface IYempty {
    }

    /** Represents a Yempty. */
    class Yempty implements IYempty {

        /**
         * Constructs a new Yempty.
         * @param [properties] Properties to set
         */
        constructor(properties?: yrpc.IYempty);

        /**
         * Encodes the specified Yempty message. Does not implicitly {@link yrpc.Yempty.verify|verify} messages.
         * @param message Yempty message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: yrpc.IYempty, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Yempty message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Yempty
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): yrpc.Yempty;
    }

    /** Properties of a Ynocare. */
    interface IYnocare {
    }

    /** Represents a Ynocare. */
    class Ynocare implements IYnocare {

        /**
         * Constructs a new Ynocare.
         * @param [properties] Properties to set
         */
        constructor(properties?: yrpc.IYnocare);

        /**
         * Encodes the specified Ynocare message. Does not implicitly {@link yrpc.Ynocare.verify|verify} messages.
         * @param message Ynocare message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: yrpc.IYnocare, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Ynocare message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Ynocare
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): yrpc.Ynocare;
    }

    /** Properties of a Ylogin. */
    interface IYlogin {

        /** Ylogin type */
        type?: (number|null);

        /** Ylogin name */
        name?: (string|null);

        /** Ylogin passwordEncrypt */
        passwordEncrypt?: (number|null);

        /** Ylogin passwordHash */
        passwordHash?: (string|null);

        /** Ylogin sys */
        sys?: (string|null);

        /** Ylogin time */
        time?: (string|null);
    }

    /** Represents a Ylogin. */
    class Ylogin implements IYlogin {

        /**
         * Constructs a new Ylogin.
         * @param [properties] Properties to set
         */
        constructor(properties?: yrpc.IYlogin);

        /** Ylogin type. */
        public type: number;

        /** Ylogin name. */
        public name: string;

        /** Ylogin passwordEncrypt. */
        public passwordEncrypt: number;

        /** Ylogin passwordHash. */
        public passwordHash: string;

        /** Ylogin sys. */
        public sys: string;

        /** Ylogin time. */
        public time: string;

        /**
         * Encodes the specified Ylogin message. Does not implicitly {@link yrpc.Ylogin.verify|verify} messages.
         * @param message Ylogin message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: yrpc.IYlogin, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Ylogin message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Ylogin
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): yrpc.Ylogin;
    }

    /** Properties of an UnixTime. */
    interface IUnixTime {

        /** UnixTime timeUnix */
        timeUnix?: (Long|null);

        /** UnixTime timeStr */
        timeStr?: (string|null);
    }

    /** Represents an UnixTime. */
    class UnixTime implements IUnixTime {

        /**
         * Constructs a new UnixTime.
         * @param [properties] Properties to set
         */
        constructor(properties?: yrpc.IUnixTime);

        /** UnixTime timeUnix. */
        public timeUnix: Long;

        /** UnixTime timeStr. */
        public timeStr: string;

        /**
         * Encodes the specified UnixTime message. Does not implicitly {@link yrpc.UnixTime.verify|verify} messages.
         * @param message UnixTime message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: yrpc.IUnixTime, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an UnixTime message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns UnixTime
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): yrpc.UnixTime;
    }

    /** Properties of a natsOption. */
    interface InatsOption {

        /** natsOption origSid */
        origSid?: (Uint8Array|null);

        /** natsOption origCid */
        origCid?: (number|null);

        /** natsOption reply */
        reply?: (string|null);

        /** natsOption obin */
        obin?: (Uint8Array|null);
    }

    /** Represents a natsOption. */
    class natsOption implements InatsOption {

        /**
         * Constructs a new natsOption.
         * @param [properties] Properties to set
         */
        constructor(properties?: yrpc.InatsOption);

        /** natsOption origSid. */
        public origSid: Uint8Array;

        /** natsOption origCid. */
        public origCid: number;

        /** natsOption reply. */
        public reply: string;

        /** natsOption obin. */
        public obin: Uint8Array;

        /**
         * Encodes the specified natsOption message. Does not implicitly {@link yrpc.natsOption.verify|verify} messages.
         * @param message natsOption message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: yrpc.InatsOption, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a natsOption message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns natsOption
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): yrpc.natsOption;
    }
}
