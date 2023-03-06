import { parseISO, format } from "date-fns";

type DateProps = {
    /** The date string to format. */
    dateString: string;
};

/**
 * Displays the provided date string as Month name day, full year.
 *
 * @param {DateProps} props
 */
export const Date = ({ dateString }: DateProps) => {
    /** Parse the date into a Date object. */
    const date = parseISO(dateString);

    return (
        <time
            className="text-xs text-indigo-900 dark:text-gray-300"
            dateTime={dateString}
        >
            {format(date, "LLLL d, yyyy")}
        </time>
    );
};
