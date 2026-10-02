/**
 * The profile's file pickers.
 *
 * All three slots live here so the page has exactly one input per kind — the
 * cards above just click the matching ref. Hidden, because every slot is
 * chosen from its own visible button or preview.
 */
export default function ProfileImageInputs({ accept, onPick, inputs }) {
  return (
    <>
      {Object.entries(inputs).map(([kind, ref]) => (
        <input
          key={kind}
          ref={ref}
          type="file"
          accept={accept}
          onChange={(event) => onPick(kind, event)}
          className="hidden"
        />
      ))}
    </>
  );
}
