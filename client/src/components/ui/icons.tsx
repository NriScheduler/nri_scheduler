import { h } from "preact";
import { FaCheck } from "react-icons/fa";
import { MdCancel, MdWarning } from "react-icons/md";

export const Check = () => <FaCheck color="green" />;
export const Warning = () => <MdWarning color="orange" />;
export const Error = () => <MdCancel color="red" />;
