import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadsAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import './index.css';

const PostLoad = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    goodsType: '',
    weightKg: '',
    pickupLocation: '',
    destination: '',
    pickupDate: '',
    pickupTime: '',
    specialRequirements: '',
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    const newErrors = {};

    if (!formData.goodsType.trim()) newErrors.goodsType = 'Goods/Material type is required.';
    if (!formData.weightKg || Number(formData.weightKg) <= 0) newErrors.weightKg = 'Please enter a valid weight in KG.';
    if (!formData.pickupLocation.trim()) newErrors.pickupLocation = 'Pickup location is required.';
    if (!formData.destination.trim()) newErrors.destination = 'Destination location is required.';
    if (!formData.pickupDate) newErrors.pickupDate = 'Pickup date is required.';
    if (!formData.pickupTime) newErrors.pickupTime = 'Pickup time is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await loadsAPI.createLoad({
        goods_type: formData.goodsType.trim(),
        weight_kg: Number(formData.weightKg),
        pickup_location: formData.pickupLocation.trim(),
        destination: formData.destination.trim(),
        pickup_date: formData.pickupDate,
        pickup_time: formData.pickupTime,
        special_requirements: formData.specialRequirements.trim() || undefined,
      });

      navigate('/customer/loads');
    } catch (error) {
      if (error.response && error.response.data) {
        const data = error.response.data;
        const fieldErrors = {};
        if (data.goods_type) fieldErrors.goodsType = Array.isArray(data.goods_type) ? data.goods_type[0] : data.goods_type;
        if (data.weight_kg) fieldErrors.weightKg = Array.isArray(data.weight_kg) ? data.weight_kg[0] : data.weight_kg;
        if (data.pickup_location) fieldErrors.pickupLocation = Array.isArray(data.pickup_location) ? data.pickup_location[0] : data.pickup_location;
        if (data.destination) fieldErrors.destination = Array.isArray(data.destination) ? data.destination[0] : data.destination;
        if (data.pickup_date) fieldErrors.pickupDate = Array.isArray(data.pickup_date) ? data.pickup_date[0] : data.pickup_date;
        if (data.pickup_time) fieldErrors.pickupTime = Array.isArray(data.pickup_time) ? data.pickup_time[0] : data.pickup_time;

        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
        } else {
          setGeneralError(data.detail || data.message || 'Unable to post load. Please verify the entered details.');
        }
      } else {
        setGeneralError('Network error. Unable to communicate with the server.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="post-load-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Post a New Shipment Load</h1>
          <p>
            Publish your freight requirements to receive instant offers from verified transporters.
          </p>
        </div>
      </div>

      <div className="post-load-card-container">
        <Card title="Freight Shipment Details">
          <ErrorMessage message={generalError} />

          <form onSubmit={handleSubmit} className="post-load-form">
            <div className="form-grid-2">
              <Input
                label="Goods / Material Type"
                id="goodsType"
                name="goodsType"
                placeholder="e.g. Industrial Steel, FMCG, Electronics"
                value={formData.goodsType}
                onChange={handleInputChange}
                error={errors.goodsType}
                required
                disabled={isSubmitting}
              />

              <Input
                label="Cargo Weight (in KG)"
                id="weightKg"
                name="weightKg"
                type="number"
                placeholder="e.g. 15000 (15 Tons)"
                value={formData.weightKg}
                onChange={handleInputChange}
                error={errors.weightKg}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-grid-2">
              <Input
                label="Pickup Address / City"
                id="pickupLocation"
                name="pickupLocation"
                placeholder="e.g. Mumbai Port Yard A, Maharashtra"
                value={formData.pickupLocation}
                onChange={handleInputChange}
                error={errors.pickupLocation}
                required
                disabled={isSubmitting}
              />

              <Input
                label="Delivery Destination"
                id="destination"
                name="destination"
                placeholder="e.g. Bangalore Industrial Area, Karnataka"
                value={formData.destination}
                onChange={handleInputChange}
                error={errors.destination}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-grid-2">
              <Input
                label="Pickup Date"
                id="pickupDate"
                name="pickupDate"
                type="date"
                value={formData.pickupDate}
                onChange={handleInputChange}
                error={errors.pickupDate}
                required
                disabled={isSubmitting}
              />

              <Input
                label="Pickup Time"
                id="pickupTime"
                name="pickupTime"
                type="time"
                value={formData.pickupTime}
                onChange={handleInputChange}
                error={errors.pickupTime}
                required
                disabled={isSubmitting}
              />
            </div>

            <Input
              label="Special Handling / Requirements (Optional)"
              id="specialRequirements"
              name="specialRequirements"
              type="textarea"
              rows={3}
              placeholder="e.g. Waterproof tarp required, fragile goods handling, hydraulic lift needed."
              value={formData.specialRequirements}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />

            <div className="post-load-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/customer/loads')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
              >
                Publish Load to Marketplace
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default PostLoad;
