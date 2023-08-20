type Props = {
  differenceImage: string;
};

const ImageCompareDiff = ({ differenceImage }: Props) => {
  return (
    <img
      style={{ maxWidth: "100%" }}
      src={differenceImage}
      alt="Difference image"
      loading="lazy"
    />
  );
};

export default ImageCompareDiff;
