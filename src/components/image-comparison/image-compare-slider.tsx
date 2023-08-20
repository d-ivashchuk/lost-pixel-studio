import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";

type Props = {
  beforeImage: string;
  afterImage: string;
};

const ImageCompareSlider = ({ beforeImage, afterImage }: Props) => {
  return (
    <ReactCompareSlider
      itemOne={
        <ReactCompareSliderImage
          src={afterImage}
          style={{
            objectFit: "contain",
            objectPosition: "left",
            width: "100%",
            height: "100%",
          }}
          alt="After"
          loading="lazy"
        />
      }
      itemTwo={
        <ReactCompareSliderImage
          src={beforeImage}
          style={{
            objectFit: "contain",
            objectPosition: "left",
            width: "100%",
            height: "100%",
          }}
          alt="Before"
          loading="lazy"
        />
      }
      position={95}
      style={{
        maxWidth: "100%",
        maxHeight: "100%",
      }}
    />
  );
};

export default ImageCompareSlider;
