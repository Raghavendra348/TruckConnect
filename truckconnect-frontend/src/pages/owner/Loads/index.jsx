import React, { useState, useEffect } from 'react';
import { loadsAPI, trucksAPI, offersAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import EmptyState from '../../../components/EmptyState';
import ErrorMessage from '../../../components/ErrorMessage';
import Modal from '../../../components/Modal';
import { formatCurrency, formatDate, formatTruckNumber, formatWeight } from '../../../utils/formatters';
import './index.css';

const OwnerLoads = () => {
  const [loads, setLoads] = useState([]);
  const [myTrucks, setMyTrucks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Make offer modal
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedTruckId, setSelectedTruckId] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');
  const [ownerMessage, setOwnerMessage] = useState('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  useEffect(() => {
    fetchMarketplaceLoadsAndTrucks();
  }, []);

  const fetchMarketplaceLoadsAndTrucks = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [loadsRes, trucksRes] = await Promise.all([
        loadsAPI.getLoads(),
        trucksAPI.getTrucks(),
      ]);

      const loadsData = loadsRes.data;
      setLoads(Array.isArray(loadsData) ? loadsData : loadsData.results || loadsData.data || []);

      const trucksData = trucksRes.data;
      const tList = Array.isArray(trucksData) ? trucksData : trucksData.results || trucksData.data || [];
      setMyTrucks(tList);
      if (tList.length > 0) {
        setSelectedTruckId(String(tList[0].id));
      }
    } catch (error) {
      setErrorMessage('Unable to load available loads or fleet information.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenOfferModal = (load) => {
    setSelectedLoad(load);
    setOfferedPrice('');
    setOwnerMessage('');
    setIsOfferModalOpen(true);
  };

  const handleCloseOfferModal = () => {
    setSelectedLoad(null);
    setIsOfferModalOpen(false);
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!selectedLoad) return;

    if (!selectedTruckId) {
      setErrorMessage('Please select an available truck from your fleet.');
      return;
    }

    if (!offeredPrice || Number(offeredPrice) <= 0) {
      setErrorMessage('Please enter a valid offer price.');
      return;
    }

    setIsSubmittingOffer(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await offersAPI.createOffer({
        load: selectedLoad.id,
        truck: Number(selectedTruckId),
        offered_price: Number(offeredPrice),
        owner_message: ownerMessage.trim() || undefined,
      });

      setIsOfferModalOpen(false);
      setSuccessMessage(
        `Offer of ${formatCurrency(offeredPrice)} submitted successfully for Load #${selectedLoad.id}!`
      );
      fetchMarketplaceLoadsAndTrucks();
    } catch (error) {
      const data = error.response?.data;
      setErrorMessage(
        data?.detail || data?.message || data?.truck || 'Unable to submit offer. Please check your truck availability.'
      );
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const filteredLoads = loads.filter((load) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const idMatch = String(load.id).includes(q);
    const goodsMatch = load.goods_type && load.goods_type.toLowerCase().includes(q);
    const pickupMatch = load.pickup_location && load.pickup_location.toLowerCase().includes(q);
    const destMatch = load.destination && load.destination.toLowerCase().includes(q);
    return idMatch || goodsMatch || pickupMatch || destMatch;
  });

  return (
    <div className="owner-loads-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Find Freight Loads</h1>
          <p>
            Browse available cargo shipments, match with your fleet capacity, and place bids.
          </p>
        </div>
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchMarketplaceLoadsAndTrucks} />

      {successMessage && (
        <div className="loads-success-banner">{successMessage}</div>
      )}

      <div className="owner-search-bar">
        <Input
          id="searchQuery"
          name="searchQuery"
          placeholder="Search by pickup city, destination, or material..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input-field"
        />
      </div>

      {isLoading ? (
        <Loading message="Fetching live marketplace loads..." />
      ) : filteredLoads.length === 0 ? (
        <EmptyState
          title="No Matching Loads"
          description="There are currently no active loads matching your search criteria."
        />
      ) : (
        <div className="loads-cards-grid">
          {filteredLoads.map((load) => (
            <Card key={load.id} className="owner-load-item-card">
              <div className="load-head">
                <div className="load-id-badge">
                  <span className="id-txt">Load #{load.id}</span>
                  <span className="goods-tag">{load.goods_type}</span>
                </div>
                <StatusBadge status={load.status || 'open'} />
              </div>

              <div className="load-route-box">
                <div className="point-item">
                  <span className="dot green-dot"></span>
                  <div>
                    <span className="lbl">Pickup</span>
                    <strong className="val">{load.pickup_location}</strong>
                  </div>
                </div>
                <div className="route-arrow-symbol">➔</div>
                <div className="point-item">
                  <span className="dot orange-dot"></span>
                  <div>
                    <span className="lbl">Delivery</span>
                    <strong className="val">{load.destination}</strong>
                  </div>
                </div>
              </div>

              <div className="load-specs-row">
                <div className="spec-col">
                  <span className="spec-lbl">Weight</span>
                  <strong className="spec-val">
                    {load.weight_kg ? Number(load.weight_kg) / 1000 : 0} Tons
                  </strong>
                </div>
                <div className="spec-col">
                  <span className="spec-lbl">Pickup Date</span>
                  <span className="spec-val">
                    {load.pickup_date ? formatDate(load.pickup_date, false) : 'Immediate'}
                  </span>
                </div>
              </div>

              {load.special_requirements && (
                <div className="load-notes-box">
                  <strong>Requirements:</strong> {load.special_requirements}
                </div>
              )}

              <div className="load-item-footer">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenOfferModal(load)}
                >
                  Make Offer / Bid
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Make Offer Modal */}
      {selectedLoad && (
        <Modal
          isOpen={isOfferModalOpen}
          onClose={handleCloseOfferModal}
          title={`Make Offer for Load #${selectedLoad.id}`}
        >
          <form onSubmit={handleSubmitOffer}>
            <div className="modal-load-summary-box">
              <span className="summary-route">
                {selectedLoad.pickup_location} ➔ {selectedLoad.destination}
              </span>
              <span className="summary-material">
                {selectedLoad.goods_type} ({selectedLoad.weight_kg ? Number(selectedLoad.weight_kg) / 1000 : 0} Tons)
              </span>
            </div>

            <Input
              label="Select Available Truck from Fleet"
              id="truckSelect"
              name="truckSelect"
              type="select"
              value={selectedTruckId}
              onChange={(e) => setSelectedTruckId(e.target.value)}
              options={
                myTrucks.length > 0
                  ? myTrucks.map((t) => ({
                      value: String(t.id),
                      label: `${formatTruckNumber(t.registration_number)} - ${t.truck_type} (${t.status})`,
                    }))
                  : [{ value: '', label: 'No trucks registered in fleet' }]
              }
              required
              disabled={isSubmittingOffer || myTrucks.length === 0}
            />

            <Input
              label="Offered Price / Total Fare (INR)"
              id="offeredPrice"
              name="offeredPrice"
              type="number"
              placeholder="e.g. 45000"
              value={offeredPrice}
              onChange={(e) => setOfferedPrice(e.target.value)}
              required
              disabled={isSubmittingOffer}
            />

            <Input
              label="Message / Terms to Shipper (Optional)"
              id="ownerMessage"
              name="ownerMessage"
              type="textarea"
              rows={3}
              placeholder="e.g. Truck available nearby, driver ready to load tomorrow morning."
              value={ownerMessage}
              onChange={(e) => setOwnerMessage(e.target.value)}
              disabled={isSubmittingOffer}
            />

            <div className="modal-actions-right">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseOfferModal}
                disabled={isSubmittingOffer}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmittingOffer}
                disabled={myTrucks.length === 0}
              >
                Submit Offer
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default OwnerLoads;
